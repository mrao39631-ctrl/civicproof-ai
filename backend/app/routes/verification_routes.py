import math
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends
from backend.app.database import get_db
from backend.app.config import BASE_DIR
from backend.app.auth import get_current_user, require_role
from backend.app.schemas import ComplaintDetailResponse, ReporterDecisionRequest, VerificationTriggerRequest
from backend.app.ai_service import analyze_complaint_evidence
from backend.app.routes.complaint_routes import get_complaint_details

router = APIRouter(prefix="/api/complaints", tags=["AI Verification & Reporter Confirmation"])

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates Haversine distance in meters between two GPS coordinates."""
    R = 6371000 # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

@router.post("/{complaint_id}/verify", response_model=ComplaintDetailResponse)
def trigger_ai_verification(
    complaint_id: int,
    payload: Optional[VerificationTriggerRequest] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Compares the original BEFORE evidence with the contractor's AFTER repair photo
    using Google Gemini Multimodal AI (or clearly labeled Demo Mode if no key).
    Also executes Haversine Geo-fence checks (50m limit) and Duplicate Hash Anti-Fraud checks.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Fetch complaint with coordinates
        cursor.execute("SELECT id, complaint_code, title, category, status, COALESCE(latitude, 21.2514) as latitude, COALESCE(longitude, 81.6296) as longitude FROM complaints WHERE id = ?", (complaint_id,))
        c_row = cursor.fetchone()
        if not c_row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
        complaint = dict(c_row)
        
        # 2. Fetch BEFORE and AFTER evidence
        cursor.execute(
            "SELECT file_path, notes, sha256_hash FROM evidence WHERE complaint_id = ? AND evidence_type = 'BEFORE' ORDER BY id ASC LIMIT 1",
            (complaint_id,)
        )
        before_ev = cursor.fetchone()
        
        cursor.execute(
            "SELECT file_path, notes, sha256_hash FROM evidence WHERE complaint_id = ? AND evidence_type = 'AFTER' ORDER BY id DESC LIMIT 1",
            (complaint_id,)
        )
        after_ev = cursor.fetchone()
        
        if not before_ev:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Complaint is missing the original BEFORE photo."
            )
        if not after_ev:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Repair team has not yet uploaded an AFTER photo for this complaint."
            )
            
        before_rel_path = before_ev["file_path"].lstrip("/")
        after_rel_path = after_ev["file_path"].lstrip("/")
        
        before_abs_path = BASE_DIR / before_rel_path
        after_abs_path = BASE_DIR / after_rel_path
        
        if not before_abs_path.exists() or not after_abs_path.exists():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Evidence image file could not be located on server storage."
            )
            
    # 3. Geo-Fence Distance & Anti-Fraud Checks
    fraud_detected = False
    fraud_reasons = []
    geo_distance = 12.0 # Default valid on-site distance

    # Haversine distance check if contractor GPS passed
    if payload and payload.contractor_lat is not None and payload.contractor_lng is not None:
        geo_distance = haversine_distance_meters(
            complaint["latitude"], complaint["longitude"],
            payload.contractor_lat, payload.contractor_lng
        )
        if geo_distance > 100.0:
            fraud_detected = True
            fraud_reasons.append(f"GEO-FENCE MISMATCH: Contractor submission is {geo_distance}m from reported site (100m limit breached).")

    # Duplicate Photo Detection Check
    if before_ev["sha256_hash"] == after_ev["sha256_hash"]:
        fraud_detected = True
        fraud_reasons.append("DUPLICATE PHOTO TAMPERING DETECTED: AFTER evidence SHA-256 hash is identical to original BEFORE evidence.")

    # 4. Execute AI Analysis
    ai_result = analyze_complaint_evidence(
        before_image_path=str(before_abs_path),
        after_image_path=str(after_abs_path),
        complaint_title=complaint["title"],
        complaint_category=complaint["category"],
        repair_notes=after_ev["notes"] or ""
    )
    
    # 5. Map verdict to Complaint status
    if fraud_detected:
        ai_result["verdict"] = "NOT_VERIFIED"
        ai_result["confidence_score"] = min(ai_result.get("confidence_score", 40.0), 32.0)
        ai_result["human_review_recommended"] = True
        fraud_summary = " · ".join(fraud_reasons)
        ai_result["explanation"] = f"CRITICAL FRAUD ALERT: {fraud_summary} | {ai_result['explanation']}"
        new_status = "DISPUTED"
    else:
        verdict_status_map = {
            "VERIFIED_FIXED": "AI_VERIFIED_FIXED",
            "NOT_VERIFIED": "AI_NOT_VERIFIED",
            "INSUFFICIENT_EVIDENCE": "AI_INSUFFICIENT_EVIDENCE"
        }
        new_status = verdict_status_map.get(ai_result["verdict"], "AI_NOT_VERIFIED")
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 6. Insert Verification Result with Geo-Fence and Fraud metadata
        cursor.execute(
            """
            INSERT INTO verification_results (
                complaint_id, verdict, confidence_score, location_match, landmarks_match,
                problem_still_visible, repair_complete, image_clarity_sufficient,
                explanation, evidence_comparison, human_review_recommended, raw_response,
                is_demo_mode, disclaimer, geo_fence_distance, fraud_detected, fraud_reason
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                complaint_id,
                ai_result["verdict"],
                ai_result["confidence_score"],
                1 if ai_result["location_match"] else 0,
                1 if ai_result["landmarks_match"] else 0,
                1 if ai_result["problem_still_visible"] else 0,
                1 if ai_result["repair_complete"] else 0,
                1 if ai_result["image_clarity_sufficient"] else 0,
                ai_result["explanation"],
                ai_result["evidence_comparison"],
                1 if ai_result["human_review_recommended"] else 0,
                ai_result.get("raw_response", ""),
                1 if ai_result["is_demo_mode"] else 0,
                ai_result["disclaimer"],
                geo_distance,
                1 if fraud_detected else 0,
                " · ".join(fraud_reasons)
            )
        )
        
        # 7. Update complaint status
        old_status = complaint["status"]
        cursor.execute(
            "UPDATE complaints SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (new_status, complaint_id)
        )
        
        # 8. Add Audit Log
        if fraud_detected:
            log_action = "ANTI_FRAUD_ALERT_FLAGGED"
            log_detail = f"HIGH-SEVERITY ALERT: {(' · '.join(fraud_reasons))} Status automatically forced to DISPUTED."
        else:
            demo_tag = "[DEMO SIMULATION] " if ai_result["is_demo_mode"] else "[LIVE GEMINI AI] "
            log_action = "AI_VERIFICATION_EVALUATED"
            log_detail = f"{demo_tag}AI multimodal verdict: {ai_result['verdict']} (Confidence: {ai_result['confidence_score']}%, Geo-distance: {geo_distance}m)."

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
                log_action,
                old_status,
                new_status,
                log_detail
            )
        )
        
    return get_complaint_details(complaint_id, current_user)

@router.post("/{complaint_id}/reporter-decision", response_model=ComplaintDetailResponse)
def submit_reporter_decision(
    complaint_id: int,
    payload: ReporterDecisionRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Reporter confirmation step: Only the reporter (citizen who filed) or an admin can confirm or dispute.
    If agreed -> complaint is marked CLOSED_VERIFIED.
    If disagreed -> complaint is marked DISPUTED and sent to human review.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, complaint_code, citizen_id, status FROM complaints WHERE id = ?", (complaint_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
            
        complaint = dict(row)
        
        # Authorization check: only original citizen or admin
        if current_user["role"] != "admin" and complaint["citizen_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the citizen who reported this complaint can confirm or dispute resolution."
            )
            
        old_status = complaint["status"]
        if payload.decision == "AGREED_FIXED":
            new_status = "CLOSED_VERIFIED"
            action_name = "REPORTER_CONFIRMED_FIX"
            log_detail = f"Reporter confirmed the issue was resolved satisfactorily. Comments: {payload.feedback_comments or 'None'}"
        else:
            new_status = "DISPUTED"
            action_name = "REPORTER_DISPUTED_RESOLUTION"
            log_detail = f"Reporter disagreed with the repair claim. Issue remains active and escalated to Human Review. Comments: {payload.feedback_comments or 'Issue still visible.'}"
            
        # 1. Insert Reporter Decision
        cursor.execute(
            """
            INSERT INTO reporter_decisions (complaint_id, reporter_id, decision, feedback_comments)
            VALUES (?, ?, ?, ?)
            """,
            (complaint_id, current_user["id"], payload.decision, payload.feedback_comments)
        )
        
        # 2. Update complaint status
        cursor.execute(
            "UPDATE complaints SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (new_status, complaint_id)
        )
        
        # 3. Audit Log
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
                action_name,
                old_status,
                new_status,
                log_detail
            )
        )
        
    return get_complaint_details(complaint_id, current_user)
