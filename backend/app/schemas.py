from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# User Schemas
class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2, max_length=100)
    role: str = Field("citizen", pattern="^(citizen|fixer|admin)$")

class UserLoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    created_at: str

class AuthTokenResponse(BaseModel):
    token: str
    user: UserResponse

# Evidence Schemas
class EvidenceResponse(BaseModel):
    id: int
    complaint_id: int
    uploader_id: int
    evidence_type: str
    file_path: str
    filename: str
    file_size: int
    mime_type: str
    sha256_hash: str
    notes: Optional[str] = None
    uploaded_at: str

# Verification Schemas
class VerificationResultResponse(BaseModel):
    id: int
    complaint_id: int
    verdict: str  # VERIFIED_FIXED, NOT_VERIFIED, INSUFFICIENT_EVIDENCE
    confidence_score: float
    location_match: bool
    landmarks_match: bool
    problem_still_visible: bool
    repair_complete: bool
    image_clarity_sufficient: bool
    explanation: str
    evidence_comparison: str
    human_review_recommended: bool
    is_demo_mode: bool
    disclaimer: str
    geo_fence_distance: Optional[float] = 0.0
    fraud_detected: Optional[bool] = False
    fraud_reason: Optional[str] = ""
    verified_at: str

class VerificationTriggerRequest(BaseModel):
    contractor_lat: Optional[float] = None
    contractor_lng: Optional[float] = None
    check_fraud: bool = True

# Reporter Decision Schemas
class ReporterDecisionRequest(BaseModel):
    decision: str = Field(..., pattern="^(AGREED_FIXED|DISAGREED_STILL_EXISTS)$")
    feedback_comments: Optional[str] = ""

class ReporterDecisionResponse(BaseModel):
    id: int
    complaint_id: int
    reporter_id: int
    decision: str
    feedback_comments: Optional[str]
    decided_at: str

# Audit Log Schemas
class AuditLogResponse(BaseModel):
    id: int
    complaint_id: Optional[int] = None
    actor_id: Optional[int] = None
    actor_name: str
    actor_role: str
    action: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    details: str
    evidence_hash: Optional[str] = None
    timestamp: str

# Complaint Schemas
class ComplaintCreateRequest(BaseModel):
    title: str = Field(..., min_length=5, max_length=150)
    description: str = Field(..., min_length=10, max_length=2000)
    category: str = Field(..., pattern="^(Garbage|Road Damage|Water Leakage|Street Light)$")
    location: str = Field(..., min_length=3, max_length=200)

class ComplaintListItem(BaseModel):
    id: int
    complaint_code: str
    title: str
    description: str
    category: str
    location: str
    latitude: Optional[float] = 21.2514
    longitude: Optional[float] = 81.6296
    citizen_id: int
    citizen_name: Optional[str] = None
    fixer_id: Optional[int] = None
    fixer_name: Optional[str] = None
    status: str
    before_image: Optional[str] = None
    after_image: Optional[str] = None
    before_hash: Optional[str] = None
    after_hash: Optional[str] = None
    created_at: str
    updated_at: str

class ComplaintDetailResponse(BaseModel):
    id: int
    complaint_code: str
    title: str
    description: str
    category: str
    location: str
    latitude: Optional[float] = 21.2514
    longitude: Optional[float] = 81.6296
    citizen_id: int
    citizen_name: str
    fixer_id: Optional[int] = None
    fixer_name: Optional[str] = None
    status: str
    created_at: str
    updated_at: str
    evidence_list: List[EvidenceResponse] = []
    verification: Optional[VerificationResultResponse] = None
    reporter_decision: Optional[ReporterDecisionResponse] = None
    audit_logs: List[AuditLogResponse] = []

# Admin Override Schema
class AdminOverrideRequest(BaseModel):
    action: str = Field(..., pattern="^(APPROVE|REJECT|REQUEST_RE_REPAIR)$")
    notes: str = Field(..., min_length=5)

# Summary Stats
class StatsSummary(BaseModel):
    total_complaints: int
    pending_complaints: int
    verified_complaints: int
    rejected_disputed_complaints: int
    in_progress_complaints: int
    by_category: Dict[str, int]
