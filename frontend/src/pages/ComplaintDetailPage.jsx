import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, 
  Clock, MapPin, User, Wrench, Shield, Sparkles, Sliders, 
  Lock, RefreshCw, ThumbsUp, ThumbsDown, MessageSquare, AlertCircle, FileCheck
} from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { SecurityBadge } from "../components/SecurityBadge";
import { VerificationCard } from "../components/VerificationCard";
import { ImageCompareModal } from "../components/ImageCompareModal";
import { useAuth } from "../context/AuthContext";

export const ComplaintDetailPage = ({ complaintId, onNavigate }) => {
  const { user, role } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0); // multi-step animation
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    loadComplaint();
  }, [complaintId]);

  const loadComplaint = async () => {
    setLoading(true);
    try {
      const data = await api.getComplaint(complaintId);
      setComplaint(data);
    } catch (err) {
      console.error("Failed to load complaint details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAiVerification = async () => {
    setVerifying(true);
    setActionError("");

    // Simulate multi-stage visual verification progress for maximum demo impact
    const steps = [
      "Ingesting cryptographically hashed BEFORE & AFTER images...",
      "Correlating geospatial landmarks and background curbs...",
      "Evaluating defect perimeter and surface elimination...",
      "Synthesizing explainable multimodal verification report..."
    ];

    setVerifyStep(0);
    const interval = setInterval(() => {
      setVerifyStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 600);

    try {
      const updated = await api.triggerAiVerification(complaintId);
      clearInterval(interval);
      setComplaint(updated);
    } catch (err) {
      clearInterval(interval);
      setActionError(err.message || "Failed to execute AI verification.");
    } finally {
      setVerifying(false);
    }
  };

  const handleReporterDecision = async (decision) => {
    setSubmittingAction(true);
    setActionError("");

    try {
      const updated = await api.submitReporterDecision(complaintId, decision, decisionNotes);
      setComplaint(updated);

      if (decision === "AGREED_FIXED") {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      setActionError(err.message || "Failed to submit reporter confirmation.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleAdminOverride = async (action) => {
    if (!adminNotes.trim()) {
      setActionError("Please provide official audit notes for this administrative decision.");
      return;
    }
    setSubmittingAction(true);
    setActionError("");

    try {
      const updated = await api.adminOverride(complaintId, action, adminNotes);
      setComplaint(updated);
      setAdminNotes("");
    } catch (err) {
      setActionError(err.message || "Failed to record admin decision.");
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "5rem 2rem", color: "var(--text-muted)" }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 1rem" }} />
        <div>Retrieving immutable complaint records...</div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <AlertTriangle size={36} color="var(--accent-rose)" style={{ margin: "0 auto 1rem" }} />
        <h3>Complaint Not Found</h3>
        <button className="btn btn-primary" onClick={() => onNavigate("citizen-dashboard")} style={{ marginTop: "1rem" }}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  const beforeEvidence = complaint.evidence_list.find((e) => e.evidence_type === "BEFORE");
  const afterEvidence = complaint.evidence_list.slice().reverse().find((e) => e.evidence_type === "AFTER");

  const canRunVerification = Boolean(beforeEvidence && afterEvidence && !complaint.verification);
  const canReVerify = Boolean(beforeEvidence && afterEvidence && complaint.verification);
  
  // Can current user act as reporter? (Citizen who filed it, or Admin)
  const isReporterOrAdmin = role === "admin" || (role === "citizen" && user?.id === complaint.citizen_id);
  const needsReporterDecision = Boolean(
    complaint.verification && 
    !complaint.reporter_decision && 
    !["CLOSED_VERIFIED", "ADMIN_APPROVED", "ADMIN_REJECTED"].includes(complaint.status)
  );

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Top navigation */}
      <button
        onClick={() => onNavigate(role === "admin" ? "admin-dashboard" : role === "fixer" ? "fixer-dashboard" : "citizen-dashboard")}
        style={{
          background: "none",
          border: "none",
          color: "var(--powder-blue)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.9rem",
          fontWeight: 600,
          marginBottom: "1.25rem"
        }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Complaint Title & Header Banner */}
      <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
              <span className="font-mono" style={{ fontSize: "0.85rem", color: "var(--powder-blue)", fontWeight: 700 }}>
                {complaint.complaint_code}
              </span>
              <span style={{ fontSize: "0.75rem", backgroundColor: "rgba(255, 255, 255, 0.08)", padding: "0.2rem 0.6rem", borderRadius: "4px", color: "var(--text-secondary)" }}>
                {complaint.category}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Filed {new Date(complaint.created_at).toLocaleDateString()}
              </span>
            </div>

            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", lineHeight: 1.25 }}>
              {complaint.title}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.6rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              <MapPin size={15} color="var(--powder-blue)" />
              <span>{complaint.location}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
            <StatusBadge status={complaint.status} />
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Reported by: <strong style={{ color: "#fff" }}>{complaint.citizen_name}</strong>
            </div>
            {complaint.fixer_name && (
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Contractor: <strong style={{ color: "var(--accent-amber)" }}>{complaint.fixer_name}</strong>
              </div>
            )}
          </div>
        </div>

        <p style={{ marginTop: "1.25rem", color: "var(--text-primary)", fontSize: "0.95rem", lineHeight: 1.6, borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
          {complaint.description}
        </p>
      </div>

      {actionError && (
        <div style={{
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "var(--radius-md)",
          padding: "0.85rem 1.25rem",
          color: "#fca5a5",
          fontSize: "0.875rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "1.5rem"
        }}>
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Visual Evidence Showcase (BEFORE vs AFTER) */}
      <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "1.1rem" }}>Photographic Evidence Dossier</h3>
          
          {beforeEvidence && afterEvidence && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setCompareModalOpen(true)}
            >
              <Sliders size={14} color="var(--powder-blue)" />
              <span>Interactive Split Slider</span>
            </button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
          {/* BEFORE Evidence Card */}
          <div style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden"
          }}>
            <div style={{ position: "relative", height: "240px", backgroundColor: "#000" }}>
              {beforeEvidence ? (
                <img
                  src={beforeEvidence.file_path}
                  alt="Original Before"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>
                  No photo uploaded
                </div>
              )}
              <div style={{
                position: "absolute",
                top: "0.75rem",
                left: "0.75rem",
                backgroundColor: "rgba(239, 68, 68, 0.9)",
                color: "#fff",
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "0.25rem 0.65rem",
                borderRadius: "var(--radius-sm)"
              }}>
                ORIGINAL BEFORE PHOTO
              </div>
            </div>

            <div style={{ padding: "1rem" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                {beforeEvidence?.notes || "Incident evidence captured by citizen"}
              </div>
              <SecurityBadge hash={beforeEvidence?.sha256_hash} timestamp={beforeEvidence?.uploaded_at} />
            </div>
          </div>

          {/* AFTER Evidence Card */}
          <div style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden"
          }}>
            <div style={{ position: "relative", height: "240px", backgroundColor: "#000" }}>
              {afterEvidence ? (
                <img
                  src={afterEvidence.file_path}
                  alt="Repair After"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", gap: "0.5rem", padding: "1rem", textAlign: "center" }}>
                  <Wrench size={32} color="var(--border-highlight)" />
                  <div style={{ fontSize: "0.85rem" }}>Awaiting contractor repair evidence</div>
                  {role === "fixer" && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onNavigate("fixer-dashboard")}
                      style={{ marginTop: "0.5rem" }}
                    >
                      Upload Repair Photo
                    </button>
                  )}
                </div>
              )}
              {afterEvidence && (
                <div style={{
                  position: "absolute",
                  top: "0.75rem",
                  left: "0.75rem",
                  backgroundColor: "rgba(16, 185, 129, 0.9)",
                  color: "#fff",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "0.25rem 0.65rem",
                  borderRadius: "var(--radius-sm)"
                }}>
                  REPAIR AFTER PHOTO
                </div>
              )}
            </div>

            <div style={{ padding: "1rem" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                {afterEvidence ? (afterEvidence.notes || "Contractor repair evidence") : "Evidence has not been submitted by repair crew yet."}
              </div>
              {afterEvidence && (
                <SecurityBadge hash={afterEvidence.sha256_hash} timestamp={afterEvidence.uploaded_at} label="After Hash" />
              )}
            </div>
          </div>
        </div>

        {/* AI Verification Trigger CTA */}
        {afterEvidence && (
          <div style={{
            marginTop: "1.5rem",
            padding: "1.25rem",
            borderRadius: "var(--radius-md)",
            backgroundColor: "rgba(56, 189, 248, 0.05)",
            border: "1px dashed rgba(56, 189, 248, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div>
              <h4 style={{ fontSize: "1rem", color: "#fff", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Sparkles size={16} color="var(--powder-blue)" />
                {complaint.verification ? "Re-run Multimodal AI Verification" : "Execute AI Multimodal Verification"}
              </h4>
              <p style={{ fontSize: "0.825rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                Compares landmark geometric positioning, road curbing, and defect resolution using Google Gemini 2.5 Flash.
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleRunAiVerification}
              disabled={verifying}
            >
              {verifying ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Analyzing Multimodal Geometry...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>{complaint.verification ? "Re-Verify Evidence" : "Run AI Verification"}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Multi-step loading banner during AI inspection */}
        {verifying && (
          <div style={{
            marginTop: "1rem",
            padding: "1rem",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--powder-blue)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Sparkles size={20} color="var(--powder-blue)" className="animate-spin" />
              <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#fff" }}>
                {[
                  "Ingesting cryptographically hashed BEFORE & AFTER images...",
                  "Correlating geospatial landmarks and background curbs...",
                  "Evaluating defect perimeter and surface elimination...",
                  "Synthesizing explainable multimodal verification report..."
                ][verifyStep]}
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ width: "100%", height: "4px", backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: "2px", marginTop: "0.75rem", overflow: "hidden" }}>
              <div style={{
                width: `${(verifyStep + 1) * 25}%`,
                height: "100%",
                backgroundColor: "var(--powder-blue)",
                transition: "width 0.5s ease"
              }} />
            </div>
          </div>
        )}
      </div>

      {/* AI Verification Results Section */}
      {complaint.verification && (
        <VerificationCard verification={complaint.verification} />
      )}

      {/* Citizen Reporter Confirmation Gate */}
      {needsReporterDecision && (
        <div className="glass-card" style={{
          marginTop: "1.5rem",
          border: "2px solid rgba(56, 189, 248, 0.4)",
          boxShadow: "0 0 25px rgba(56, 189, 248, 0.15)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
            <FileCheck size={24} color="var(--powder-blue)" />
            <h3 style={{ fontSize: "1.25rem", color: "#fff" }}>Citizen Approval Gate</h3>
          </div>
          <p style={{ fontSize: "0.925rem", color: "var(--text-secondary)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
            Civic complaints cannot be automatically closed by contractors or AI alone. As the citizen reporter, does the AFTER photo 
            and real-world physical site reflect satisfactory defect resolution?
          </p>

          <div className="form-group">
            <label className="form-label">Reporter Feedback / Observations (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Inspected site at 8 AM, debris is fully cleared and curb is clean."
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
            <button
              className="btn btn-success"
              style={{ flex: 1, minWidth: "200px" }}
              disabled={submittingAction}
              onClick={() => handleReporterDecision("AGREED_FIXED")}
            >
              <ThumbsUp size={18} />
              <span>Yes, Problem Fixed (Close Case)</span>
            </button>

            <button
              className="btn btn-danger"
              style={{ flex: 1, minWidth: "200px" }}
              disabled={submittingAction}
              onClick={() => handleReporterDecision("DISAGREED_STILL_EXISTS")}
            >
              <ThumbsDown size={18} />
              <span>No, Problem Still Exists (Dispute)</span>
            </button>
          </div>
        </div>
      )}

      {/* Reporter Decision Already Recorded Display */}
      {complaint.reporter_decision && (
        <div className="glass-card" style={{
          marginTop: "1.5rem",
          borderLeft: `4px solid ${complaint.reporter_decision.decision === "AGREED_FIXED" ? "var(--accent-emerald)" : "var(--accent-rose)"}`
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              {complaint.reporter_decision.decision === "AGREED_FIXED" ? (
                <CheckCircle2 size={22} color="var(--accent-emerald)" />
              ) : (
                <XCircle size={22} color="var(--accent-rose)" />
              )}
              <h4 style={{ fontSize: "1.05rem" }}>
                Reporter Decision: {complaint.reporter_decision.decision === "AGREED_FIXED" ? "Agreed — Problem Fixed" : "Disputed — Problem Still Exists"}
              </h4>
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Recorded on {new Date(complaint.reporter_decision.decided_at).toLocaleString()}
            </span>
          </div>
          {complaint.reporter_decision.feedback_comments && (
            <div style={{ marginTop: "0.75rem", fontSize: "0.9rem", color: "var(--text-primary)" }}>
              "{complaint.reporter_decision.feedback_comments}"
            </div>
          )}
        </div>
      )}

      {/* Administrator Human Review Override Box (Visible to Admin) */}
      {role === "admin" && (
        <div className="glass-card" style={{ marginTop: "1.5rem", borderLeft: "4px solid var(--accent-purple)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <Shield size={20} color="var(--accent-purple)" />
            <h3 style={{ fontSize: "1.15rem" }}>Administrator Human Review Override</h3>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            As a municipal supervisor or human auditor, you can override status, resolve disputes, or reopen tickets for corrective re-work.
          </p>

          <div className="form-group">
            <label className="form-label">Audit Notes & Administrative Justification *</label>
            <input
              type="text"
              required
              placeholder="e.g. Human on-site physical inspection verified asphalt patch was properly compacted to municipal spec."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              className="btn btn-success btn-sm"
              disabled={submittingAction}
              onClick={() => handleAdminOverride("APPROVE")}
            >
              <CheckCircle2 size={14} /> Official Approval
            </button>
            <button
              className="btn btn-danger btn-sm"
              disabled={submittingAction}
              onClick={() => handleAdminOverride("REJECT")}
            >
              <XCircle size={14} /> Reject Contractor Repair
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={submittingAction}
              onClick={() => handleAdminOverride("REQUEST_RE_REPAIR")}
            >
              <Wrench size={14} /> Reopen For Crew Re-Work
            </button>
          </div>
        </div>
      )}

      {/* Immutable Audit Ledger for this Complaint */}
      <div className="glass-card" style={{ marginTop: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <Lock size={18} color="var(--powder-blue)" />
          <h3 style={{ fontSize: "1.1rem" }}>Tamper-Evident Audit History</h3>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {complaint.audit_logs.map((log) => (
            <div
              key={log.id}
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "0.85rem 1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: log.actor_role === "admin" ? "var(--accent-purple)" : log.actor_role === "fixer" ? "var(--accent-amber)" : "var(--powder-blue)"
                  }}>
                    [{log.actor_role}] {log.actor_name}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>•</span>
                  <span className="font-mono" style={{ fontSize: "0.75rem", color: "var(--text-powder)" }}>
                    {log.action}
                  </span>
                </div>

                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>

              <p style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{log.details}</p>

              {log.evidence_hash && (
                <div style={{ marginTop: "0.25rem" }}>
                  <SecurityBadge hash={log.evidence_hash} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Split Slider / Comparison Modal */}
      {beforeEvidence && afterEvidence && (
        <ImageCompareModal
          isOpen={compareModalOpen}
          onClose={() => setCompareModalOpen(false)}
          beforeImg={beforeEvidence.file_path}
          afterImg={afterEvidence.file_path}
          beforeHash={beforeEvidence.sha256_hash}
          afterHash={afterEvidence.sha256_hash}
          title={`${complaint.complaint_code}: ${complaint.title}`}
        />
      )}
    </div>
  );
};
