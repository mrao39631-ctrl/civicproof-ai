import hashlib
import uuid
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from backend.app.database import get_db
from backend.app.config import UPLOADS_DIR, MAX_UPLOAD_SIZE_BYTES, ALLOWED_MIME_TYPES
from backend.app.auth import require_role
from backend.app.schemas import ComplaintDetailResponse
from backend.app.routes.complaint_routes import get_complaint_details

router = APIRouter(prefix="/api/complaints", tags=["Evidence & Repairs"])

@router.post("/{complaint_id}/evidence/before", response_model=ComplaintDetailResponse)
async def upload_before_evidence(
    complaint_id: int,
    notes: str = Form("Updated BEFORE evidence"),
    before_photo: UploadFile = File(...),
    current_user: dict = Depends(require_role("fixer", "admin", "citizen"))
):
    """Allows updating or replacing the BEFORE incident evidence for demo testing."""
    if before_photo.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image type '{before_photo.content_type}'. Must be JPEG, PNG, or WEBP."
        )
        
    file_bytes = await before_photo.read()
    file_size = len(file_bytes)
    if file_size > MAX_UPLOAD_SIZE_BYTES or file_size < 100:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file size.")
        
    sha256_hash = hashlib.sha256(file_bytes).hexdigest()
    extension = ALLOWED_MIME_TYPES[before_photo.content_type]
    unique_filename = f"before_{uuid.uuid4().hex[:12]}{extension}"
    save_path = UPLOADS_DIR / unique_filename
    with open(save_path, "wb") as f:
        f.write(file_bytes)
        
    public_url = f"/uploads/{unique_filename}"
    
    with get_db() as conn:
        cursor = conn.cursor()
        # Delete existing BEFORE photo or add new
        cursor.execute("DELETE FROM evidence WHERE complaint_id = ? AND evidence_type = 'BEFORE'", (complaint_id,))
        cursor.execute(
            """
            INSERT INTO evidence (complaint_id, uploader_id, evidence_type, file_path, filename, file_size, mime_type, sha256_hash, notes)
            VALUES (?, ?, 'BEFORE', ?, ?, ?, ?, ?, ?)
            """,
            (complaint_id, current_user["id"], public_url, before_photo.filename or unique_filename, file_size, before_photo.content_type, sha256_hash, notes)
        )
        cursor.execute(
            """
            INSERT INTO audit_logs (complaint_id, actor_id, actor_name, actor_role, action, old_status, new_status, details, evidence_hash)
            VALUES (?, ?, ?, ?, 'BEFORE_EVIDENCE_UPDATED', NULL, NULL, ?, ?)
            """,
            (complaint_id, current_user["id"], current_user["full_name"], current_user["role"], f"BEFORE photo replaced. SHA-256: {sha256_hash[:16]}...", sha256_hash)
        )
        
    return get_complaint_details(complaint_id, current_user)

@router.post("/{complaint_id}/evidence/after", response_model=ComplaintDetailResponse)
async def upload_after_evidence(
    complaint_id: int,
    repair_notes: str = Form(""),
    after_photo: UploadFile = File(...),
    current_user: dict = Depends(require_role("fixer", "admin"))
):
    """Allows repair teams (fixers) or admins to submit AFTER-repair evidence."""
    # 1. Check complaint status
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, complaint_code, status, fixer_id FROM complaints WHERE id = ?", (complaint_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
        
        complaint = dict(row)
        current_status = complaint["status"]
        if current_status in ["CLOSED_VERIFIED", "ADMIN_APPROVED"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Complaint is already closed and verified. No further repair evidence can be submitted."
            )
    
    # 2. Validate uploaded image
    if after_photo.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image type '{after_photo.content_type}'. Must be JPEG, PNG, or WEBP."
        )
        
    file_bytes = await after_photo.read()
    file_size = len(file_bytes)
    if file_size > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum 10MB limit."
        )
    if file_size < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File appears empty or unreadable."
        )
        
    # 3. Cryptographic SHA-256 Hash
    sha256_hash = hashlib.sha256(file_bytes).hexdigest()
    
    # 4. Save file securely
    extension = ALLOWED_MIME_TYPES[after_photo.content_type]
    unique_filename = f"after_{uuid.uuid4().hex[:12]}{extension}"
    save_path = UPLOADS_DIR / unique_filename
    with open(save_path, "wb") as f:
        f.write(file_bytes)
        
    public_url = f"/uploads/{unique_filename}"
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 5. Insert Evidence record
        cursor.execute(
            """
            INSERT INTO evidence (complaint_id, uploader_id, evidence_type, file_path, filename, file_size, mime_type, sha256_hash, notes)
            VALUES (?, ?, 'AFTER', ?, ?, ?, ?, ?, ?)
            """,
            (complaint_id, current_user["id"], public_url, after_photo.filename or unique_filename, file_size, after_photo.content_type, sha256_hash, repair_notes)
        )
        
        # 6. Update complaint status and assign fixer
        new_status = "REPAIR_SUBMITTED"
        cursor.execute(
            """
            UPDATE complaints 
            SET status = ?, fixer_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (new_status, current_user["id"], complaint_id)
        )
        
        # 7. Audit Log
        cursor.execute(
            """
            INSERT INTO audit_logs (complaint_id, actor_id, actor_name, actor_role, action, old_status, new_status, details, evidence_hash)
            VALUES (?, ?, ?, ?, 'REPAIR_EVIDENCE_SUBMITTED', ?, ?, ?, ?)
            """,
            (
                complaint_id, 
                current_user["id"], 
                current_user["full_name"], 
                current_user["role"], 
                current_status, 
                new_status, 
                f"Repair team uploaded AFTER evidence photo. Notes: '{repair_notes}'. SHA-256: {sha256_hash[:16]}...",
                sha256_hash
            )
        )
        
    return get_complaint_details(complaint_id, current_user)
