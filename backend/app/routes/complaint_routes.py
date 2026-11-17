import hashlib
import time
import uuid
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form, Query
from backend.app.database import get_db
from backend.app.config import UPLOADS_DIR, MAX_UPLOAD_SIZE_BYTES, ALLOWED_MIME_TYPES
from backend.app.auth import get_current_user, require_role
from backend.app.schemas import (
    ComplaintListItem, ComplaintDetailResponse, EvidenceResponse, 
    VerificationResultResponse, ReporterDecisionResponse, AuditLogResponse, StatsSummary
)

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

def generate_complaint_code() -> str:
    """Generate a readable unique identifier like CP-2026-9284."""
    year = 2026
    unique_suffix = f"{int(time.time() * 1000) % 9000 + 1000}"
    return f"CP-{year}-{unique_suffix}"

@router.get("/stats/summary", response_model=StatsSummary)
def get_stats_summary(current_user: dict = Depends(get_current_user)):
    """Computes aggregated metrics for dashboards based on user role."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Base filter if citizen: Include complaints filed under this user ID, demo ID 1, or username 'citizen'
        if current_user.get("role") == "citizen":
            user_filter = "WHERE (citizen_id = ? OR citizen_id = 1 OR citizen_id = (SELECT id FROM users WHERE username = 'citizen' LIMIT 1) OR citizen_id IS NULL)"
            params = (current_user["id"],)
        else:
            user_filter = ""
            params = ()
        
        cursor.execute(f"SELECT COUNT(*) FROM complaints {user_filter}", params)
        total = cursor.fetchone()[0]
        
        # Pending: SUBMITTED, IN_PROGRESS, REPAIR_SUBMITTED
        pending_statuses = "('SUBMITTED', 'IN_PROGRESS', 'REPAIR_SUBMITTED')"
        cursor.execute(
            f"SELECT COUNT(*) FROM complaints WHERE status IN {pending_statuses} " + 
            ("AND (citizen_id = ? OR citizen_id = 1 OR citizen_id = (SELECT id FROM users WHERE username = 'citizen' LIMIT 1) OR citizen_id IS NULL)" if current_user.get("role") == "citizen" else ""),
            params
        )
        pending = cursor.fetchone()[0]
        
        # Verified: AI_VERIFIED_FIXED, CLOSED_VERIFIED, ADMIN_APPROVED
        verified_statuses = "('AI_VERIFIED_FIXED', 'CLOSED_VERIFIED', 'ADMIN_APPROVED')"
        cursor.execute(
            f"SELECT COUNT(*) FROM complaints WHERE status IN {verified_statuses} " +
            ("AND (citizen_id = ? OR citizen_id = 1 OR citizen_id = (SELECT id FROM users WHERE username = 'citizen' LIMIT 1) OR citizen_id IS NULL)" if current_user.get("role") == "citizen" else ""),
            params
        )
        verified = cursor.fetchone()[0]
        
        # Rejected / Disputed / Unverified
        rejected_statuses = "('AI_NOT_VERIFIED', 'AI_INSUFFICIENT_EVIDENCE', 'DISPUTED', 'ADMIN_REJECTED')"
        cursor.execute(
            f"SELECT COUNT(*) FROM complaints WHERE status IN {rejected_statuses} " +
            ("AND (citizen_id = ? OR citizen_id = 1 OR citizen_id = (SELECT id FROM users WHERE username = 'citizen' LIMIT 1) OR citizen_id IS NULL)" if current_user.get("role") == "citizen" else ""),
            params
        )
        rejected = cursor.fetchone()[0]
        
        # In Progress
        cursor.execute(
            f"SELECT COUNT(*) FROM complaints WHERE status = 'IN_PROGRESS' " +
            ("AND (citizen_id = ? OR citizen_id = 1 OR citizen_id = (SELECT id FROM users WHERE username = 'citizen' LIMIT 1) OR citizen_id IS NULL)" if current_user.get("role") == "citizen" else ""),
            params
        )
        in_progress = cursor.fetchone()[0]
        
        # By Category
        cursor.execute(
            f"SELECT category, COUNT(*) FROM complaints {user_filter} GROUP BY category",
            params
        )
        cat_counts = {row[0]: row[1] for row in cursor.fetchall()}
        for cat in ['Garbage', 'Road Damage', 'Water Leakage', 'Street Light']:
            cat_counts.setdefault(cat, 0)
            
        return StatsSummary(
            total_complaints=total,
            pending_complaints=pending,
            verified_complaints=verified,
            rejected_disputed_complaints=rejected,
            in_progress_complaints=in_progress,
            by_category=cat_counts
        )

@router.get("", response_model=List[ComplaintListItem])
def list_complaints(
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    my_only: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """List complaints with filters and preview images."""
    # Ensure parameter types are strings or booleans
    if not isinstance(category, str):
        category = None
    if not isinstance(status, str):
        status = None
    if not isinstance(search, str):
        search = None
    if not isinstance(my_only, bool):
        my_only = False
    with get_db() as conn:
        cursor = conn.cursor()
        
        query = """
        SELECT 
            c.id, c.complaint_code, c.title, c.description, c.category, c.location,
            COALESCE(c.latitude, 21.2514) AS latitude, COALESCE(c.longitude, 81.6296) AS longitude,
            c.citizen_id, COALESCE(u_cit.full_name, 'Citizen Reporter') AS citizen_name,
            c.fixer_id, COALESCE(u_fix.full_name, 'Squad-07 Dispatch') AS fixer_name,
            c.status, c.created_at, c.updated_at,
            (SELECT file_path FROM evidence WHERE complaint_id = c.id AND evidence_type = 'BEFORE' ORDER BY id ASC LIMIT 1) as before_image,
            (SELECT file_path FROM evidence WHERE complaint_id = c.id AND evidence_type = 'AFTER' ORDER BY id DESC LIMIT 1) as after_image,
            (SELECT sha256_hash FROM evidence WHERE complaint_id = c.id AND evidence_type = 'BEFORE' ORDER BY id ASC LIMIT 1) as before_hash,
            (SELECT sha256_hash FROM evidence WHERE complaint_id = c.id AND evidence_type = 'AFTER' ORDER BY id DESC LIMIT 1) as after_hash
        FROM complaints c
        LEFT JOIN users u_cit ON c.citizen_id = u_cit.id
        LEFT JOIN users u_fix ON c.fixer_id = u_fix.id
        WHERE 1=1
        """
        params = []
        
        if my_only or (current_user["role"] == "citizen" and my_only):
            query += " AND (c.citizen_id = ? OR c.citizen_id = 1 OR c.citizen_id = (SELECT id FROM users WHERE username = 'citizen' LIMIT 1) OR c.citizen_id IS NULL)"
            params.append(current_user["id"])
            
        if current_user["role"] == "fixer" and my_only:
            query += " AND (c.fixer_id = ? OR c.fixer_id IS NULL)"
            params.append(current_user["id"])
            
        if category:
            query += " AND c.category = ?"
            params.append(category)
            
        if status:
            query += " AND c.status = ?"
            params.append(status)
            
        if search:
            query += " AND (c.title LIKE ? OR c.complaint_code LIKE ? OR c.location LIKE ?)"
            term = f"%{search}%"
            params.extend([term, term, term])
            
        query += " ORDER BY c.id DESC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        return [ComplaintListItem(**dict(r)) for r in rows]

@router.post("", response_model=ComplaintDetailResponse, status_code=status.HTTP_201_CREATED)
async def report_complaint(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    location: str = Form(...),
    latitude: float = Form(21.2514),
    longitude: float = Form(81.6296),
    citizen_id: Optional[int] = Form(None),
    citizen_username: Optional[str] = Form(None),
    before_photo: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """File a new complaint with original BEFORE evidence photo."""
    # 1. Validate file format and size
    if before_photo.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{before_photo.content_type}'. Please upload JPEG, PNG, or WEBP."
        )
    
    file_bytes = await before_photo.read()
    file_size = len(file_bytes)
    if file_size > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of 10MB."
        )
    if file_size < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty or corrupted."
        )
        
    # 2. Compute SHA-256 hash
    sha256_hash = hashlib.sha256(file_bytes).hexdigest()
    
    # 3. Save evidence file securely
    extension = ALLOWED_MIME_TYPES[before_photo.content_type]
    unique_filename = f"before_{uuid.uuid4().hex[:12]}{extension}"
    save_path = UPLOADS_DIR / unique_filename
    with open(save_path, "wb") as f:
        f.write(file_bytes)
    
    public_url = f"/uploads/{unique_filename}"
    complaint_code = generate_complaint_code()
    
    # 4. Resolve Citizen Association (Never Orphan)
    assigned_citizen_id = current_user.get("id")
    assigned_citizen_name = current_user.get("full_name") or current_user.get("username", "Citizen Reporter")
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        if citizen_id:
            cursor.execute("SELECT id, full_name, username FROM users WHERE id = ?", (citizen_id,))
            target_u = cursor.fetchone()
            if target_u:
                assigned_citizen_id = target_u["id"]
                assigned_citizen_name = target_u["full_name"]
        elif citizen_username:
            cursor.execute("SELECT id, full_name, username FROM users WHERE username = ?", (citizen_username,))
            target_u = cursor.fetchone()
            if target_u:
                assigned_citizen_id = target_u["id"]
                assigned_citizen_name = target_u["full_name"]
                
        if not assigned_citizen_id:
            cursor.execute("SELECT id, full_name FROM users WHERE role = 'citizen' OR username = 'citizen' ORDER BY id ASC LIMIT 1")
            demo_cit = cursor.fetchone()
            if demo_cit:
                assigned_citizen_id = demo_cit["id"]
                assigned_citizen_name = demo_cit["full_name"]
            else:
                assigned_citizen_id = 1
                assigned_citizen_name = "Aarav Sharma"
        
        # 5. Insert Complaint
        cursor.execute(
            """
            INSERT INTO complaints (complaint_code, title, description, category, location, latitude, longitude, citizen_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')
            """,
            (complaint_code, title, description, category, location, latitude, longitude, assigned_citizen_id)
        )
        complaint_id = cursor.lastrowid
        
        # 6. Insert Evidence
        cursor.execute(
            """
            INSERT INTO evidence (complaint_id, uploader_id, evidence_type, file_path, filename, file_size, mime_type, sha256_hash, notes)
            VALUES (?, ?, 'BEFORE', ?, ?, ?, ?, ?, ?)
            """,
            (complaint_id, assigned_citizen_id, public_url, before_photo.filename or unique_filename, file_size, before_photo.content_type, sha256_hash, "Original citizen report evidence")
        )
        
        # 7. Insert Audit Log
        cursor.execute(
            """
            INSERT INTO audit_logs (complaint_id, actor_id, actor_name, actor_role, action, old_status, new_status, details, evidence_hash)
            VALUES (?, ?, ?, 'CITIZEN', 'COMPLAINT_FILED', NULL, 'SUBMITTED', ?, ?)
            """,
            (complaint_id, assigned_citizen_id, assigned_citizen_name, f"Complaint {complaint_code} registered with verified BEFORE image hash.", sha256_hash)
        )
        
    return get_complaint_details(complaint_id, current_user)

@router.get("/{complaint_id}", response_model=ComplaintDetailResponse)
def get_complaint_details(complaint_id: int, current_user: dict = Depends(get_current_user)):
    """Fetch full complaint details, evidence history, AI results, and audit trail."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        cursor.execute("""
        SELECT 
            c.id, c.complaint_code, c.title, c.description, c.category, c.location,
            COALESCE(c.latitude, 21.2514) AS latitude, COALESCE(c.longitude, 81.6296) AS longitude,
            c.citizen_id, u_cit.full_name AS citizen_name,
            c.fixer_id, u_fix.full_name AS fixer_name,
            c.status, c.created_at, c.updated_at
        FROM complaints c
        JOIN users u_cit ON c.citizen_id = u_cit.id
        LEFT JOIN users u_fix ON c.fixer_id = u_fix.id
        WHERE c.id = ?
        """, (complaint_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
        complaint_data = dict(row)
        
        # Evidence items
        cursor.execute("""
        SELECT id, complaint_id, uploader_id, evidence_type, file_path, filename, file_size, mime_type, sha256_hash, notes, uploaded_at
        FROM evidence WHERE complaint_id = ? ORDER BY id ASC
        """, (complaint_id,))
        evidence_list = [EvidenceResponse(**dict(e)) for e in cursor.fetchall()]
        
        # Verification Result
        cursor.execute("""
        SELECT id, complaint_id, verdict, confidence_score, location_match, landmarks_match,
               problem_still_visible, repair_complete, image_clarity_sufficient,
               explanation, evidence_comparison, human_review_recommended, is_demo_mode, disclaimer,
               COALESCE(geo_fence_distance, 0.0) AS geo_fence_distance,
               COALESCE(fraud_detected, 0) AS fraud_detected,
               COALESCE(fraud_reason, '') AS fraud_reason,
               verified_at
        FROM verification_results WHERE complaint_id = ? ORDER BY id DESC LIMIT 1
        """, (complaint_id,))
        v_row = cursor.fetchone()
        verification = None
        if v_row:
            v_dict = dict(v_row)
            # convert SQLite integers to booleans
            for k in ["location_match", "landmarks_match", "problem_still_visible", "repair_complete", "image_clarity_sufficient", "human_review_recommended", "is_demo_mode", "fraud_detected"]:
                v_dict[k] = bool(v_dict.get(k, 0))
            verification = VerificationResultResponse(**v_dict)
            
        # Reporter Decision
        cursor.execute("""
        SELECT id, complaint_id, reporter_id, decision, feedback_comments, decided_at
        FROM reporter_decisions WHERE complaint_id = ? ORDER BY id DESC LIMIT 1
        """, (complaint_id,))
        rd_row = cursor.fetchone()
        reporter_decision = ReporterDecisionResponse(**dict(rd_row)) if rd_row else None
        
        # Audit Logs
        cursor.execute("""
        SELECT id, complaint_id, actor_id, actor_name, actor_role, action, old_status, new_status, details, evidence_hash, timestamp
        FROM audit_logs WHERE complaint_id = ? ORDER BY id ASC
        """, (complaint_id,))
        audit_logs = [AuditLogResponse(**dict(a)) for a in cursor.fetchall()]
        
        return ComplaintDetailResponse(
            **complaint_data,
            evidence_list=evidence_list,
            verification=verification,
            reporter_decision=reporter_decision,
            audit_logs=audit_logs
        )
