from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from backend.app.database import get_db
from backend.app.auth import require_role, get_current_user
from backend.app.schemas import ComplaintListItem, ComplaintDetailResponse, AdminOverrideRequest, AuditLogResponse
from backend.app.routes.complaint_routes import get_complaint_details

router = APIRouter(prefix="/api/admin", tags=["Administrator & Human Review"])

@router.get("/disputes", response_model=List[ComplaintListItem])
def get_disputed_complaints(
    current_user: dict = Depends(require_role("admin"))
):
    """Fetch complaints flagged for human review or disputed by citizens."""
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
        WHERE c.status IN ('DISPUTED', 'AI_NOT_VERIFIED', 'AI_INSUFFICIENT_EVIDENCE', 'REPAIR_SUBMITTED')
        ORDER BY c.updated_at DESC
        """
        cursor.execute(query)
        rows = cursor.fetchall()
        return [ComplaintListItem(**dict(r)) for r in rows]

@router.post("/complaints/{complaint_id}/override", response_model=ComplaintDetailResponse)
def admin_human_override(
    complaint_id: int,
    payload: AdminOverrideRequest,
    current_user: dict = Depends(require_role("admin"))
):
    """Human review decision: administrator overrides or finalizes resolution."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, complaint_code, status FROM complaints WHERE id = ?", (complaint_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
            
        complaint = dict(row)
        old_status = complaint["status"]
        
        if payload.action == "APPROVE":
            new_status = "CLOSED_VERIFIED"
            action_label = "ADMIN_APPROVED_RESOLUTION"
        elif payload.action == "REJECT":
            new_status = "ADMIN_REJECTED"
            action_label = "ADMIN_REJECTED_RESOLUTION"
        else: # REQUEST_RE_REPAIR
            new_status = "IN_PROGRESS"
            action_label = "ADMIN_REOPENED_FOR_REPAIR"
            
        cursor.execute(
            "UPDATE complaints SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (new_status, complaint_id)
        )
        
        cursor.execute(
            """
            INSERT INTO audit_logs (complaint_id, actor_id, actor_name, actor_role, action, old_status, new_status, details)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                complaint_id,
                current_user["id"],
                current_user["full_name"],
                current_user["role"],
                action_label,
                old_status,
                new_status,
                f"Official Human Review Override by {current_user['full_name']}. Action: {payload.action}. Official Notes: {payload.notes}"
            )
        )
        
    return get_complaint_details(complaint_id, current_user)

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_system_audit_logs(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """System-wide immutable ledger of all civic events, state changes, and SHA-256 evidence hashes."""
    if not isinstance(limit, int):
        limit = 50
    limit = max(1, min(limit, 200))
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT id, complaint_id, actor_id, actor_name, actor_role, action, old_status, new_status, details, evidence_hash, timestamp
        FROM audit_logs
        ORDER BY id DESC
        LIMIT ?
        """, (limit,))
        return [AuditLogResponse(**dict(r)) for r in cursor.fetchall()]
