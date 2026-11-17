import React from "react";
import { 
  ShieldCheck, AlertTriangle, HelpCircle, Check, X, 
  Sparkles, Info, Eye, UserCheck, AlertCircle 
} from "lucide-react";

export const VerificationCard = ({ verification }) => {
  if (!verification) return null;

  const {
    verdict,
    confidence_score,
    location_match,
    landmarks_match,
    problem_still_visible,
    repair_complete,
    image_clarity_sufficient,
    explanation,
    evidence_comparison,
    human_review_recommended,
    is_demo_mode,
    disclaimer
  } = verification;

  // Verdict config
  const getVerdictStyle = () => {
    switch (verdict) {
      case "VERIFIED_FIXED":
        return {
          bannerClass: "verdict-fixed",
          icon: <ShieldCheck size={36} color="var(--accent-emerald)" />,
          title: "VERIFIED FIXED",
          subtitle: "Independent AI verification indicates the civic defect appears successfully resolved.",
          color: "var(--accent-emerald)"
        };
      case "NOT_VERIFIED":
        return {
          bannerClass: "verdict-not-verified",
          icon: <AlertTriangle size={36} color="var(--accent-amber)" />,
          title: "NOT VERIFIED",
          subtitle: "Reported problem remains visible or evidence contradicts the contractor claim.",
          color: "var(--accent-amber)"
        };
      case "INSUFFICIENT_EVIDENCE":
      default:
        return {
          bannerClass: "verdict-insufficient",
          icon: <HelpCircle size={36} color="var(--accent-purple)" />,
          title: "INSUFFICIENT EVIDENCE",
          subtitle: "Images are unclear, blurry, or lack required reference landmarks for confirmation.",
          color: "var(--accent-purple)"
        };
    }
  };

  const style = getVerdictStyle();

  return (
    <div className="glass-card" style={{ marginTop: "1.5rem", position: "relative", overflow: "hidden" }}>
      {/* Demo Mode Notice Badge */}
      {is_demo_mode && (
        <div style={{
          backgroundColor: "rgba(245, 158, 11, 0.15)",
          borderBottom: "1px solid rgba(245, 158, 11, 0.3)",
          margin: "-1.5rem -1.5rem 1.5rem -1.5rem",
          padding: "0.6rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "0.8rem",
          color: "#fcd34d"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Sparkles size={14} />
            <strong>DEMO MODE (Simulated Analysis):</strong>
            <span>Results generated using fallback heuristic simulator. Set GEMINI_API_KEY in backend/.env for live multimodal AI.</span>
          </div>
          <span style={{ fontWeight: 600, textDecoration: "underline" }}>Simulated</span>
        </div>
      )}

      {/* Main Verdict Banner */}
      <div className={`verdict-banner ${style.bannerClass}`}>
        <div style={{ flexShrink: 0 }}>
          {style.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: style.color }}>{style.title}</h2>
            <div style={{
              backgroundColor: "rgba(0, 0, 0, 0.35)",
              border: `1px solid ${style.color}`,
              borderRadius: "var(--radius-md)",
              padding: "0.3rem 0.8rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>AI Confidence</span>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "#fff" }}>{confidence_score}%</span>
            </div>
          </div>
          <p style={{ marginTop: "0.35rem", fontSize: "0.95rem", color: "var(--text-primary)" }}>{style.subtitle}</p>
        </div>
      </div>

      {/* 5-Point Multimodal Verification Checklist */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
          Multimodal Spatial & Physical Verification Checklist
        </h4>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "0.75rem"
        }}>
          {/* 1. Location Match */}
          <div style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "0.85rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Location Coordinates</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Same geographic scene?</div>
            </div>
            {location_match ? (
              <span className="badge badge-green"><Check size={12} /> Matched</span>
            ) : (
              <span className="badge badge-red"><X size={12} /> Divergent</span>
            )}
          </div>

          {/* 2. Landmarks Match */}
          <div style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "0.85rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Surrounding Landmarks</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Poles, curbs, walls aligned?</div>
            </div>
            {landmarks_match ? (
              <span className="badge badge-green"><Check size={12} /> Aligned</span>
            ) : (
              <span className="badge badge-amber"><AlertTriangle size={12} /> Unclear</span>
            )}
          </div>

          {/* 3. Problem Visibility */}
          <div style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "0.85rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Defect Visibility</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Is problem still detectable?</div>
            </div>
            {!problem_still_visible ? (
              <span className="badge badge-green"><Check size={12} /> Resolved</span>
            ) : (
              <span className="badge badge-red"><X size={12} /> Still Visible</span>
            )}
          </div>

          {/* 4. Repair Completeness */}
          <div style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "0.85rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Workmanship State</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Complete restoration?</div>
            </div>
            {repair_complete ? (
              <span className="badge badge-green"><Check size={12} /> Complete</span>
            ) : (
              <span className="badge badge-amber"><AlertTriangle size={12} /> Incomplete</span>
            )}
          </div>

          {/* 5. Image Clarity */}
          <div style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-md)",
            padding: "0.85rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Evidence Clarity</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Lighting & resolution</div>
            </div>
            {image_clarity_sufficient ? (
              <span className="badge badge-blue"><Eye size={12} /> Sufficient</span>
            ) : (
              <span className="badge badge-purple"><AlertTriangle size={12} /> Blurry / Dark</span>
            )}
          </div>
        </div>
      </div>

      {/* Explainable AI Details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{
          backgroundColor: "rgba(13, 23, 40, 0.6)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)",
          padding: "1rem"
        }}>
          <h5 style={{ fontSize: "0.825rem", color: "var(--powder-blue)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Sparkles size={14} /> Explainable AI Assessment
          </h5>
          <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", lineHeight: 1.6 }}>{explanation}</p>
        </div>

        <div style={{
          backgroundColor: "rgba(13, 23, 40, 0.6)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)",
          padding: "1rem"
        }}>
          <h5 style={{ fontSize: "0.825rem", color: "var(--text-powder)", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Info size={14} /> Evidence Comparison Breakdown
          </h5>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
            {evidence_comparison}
          </p>
        </div>
      </div>

      {/* Human Review Recommendation Flag */}
      {human_review_recommended && (
        <div style={{
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "var(--radius-md)",
          padding: "0.85rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.25rem",
          color: "#fca5a5"
        }}>
          <UserCheck size={20} color="var(--accent-rose)" />
          <div style={{ fontSize: "0.85rem" }}>
            <strong>Human Review Escalation Recommended:</strong> Due to confidence scores or unresolved defects, an administrator or municipal auditor must review this evidence before sign-off.
          </div>
        </div>
      )}

      {/* Mandatory Ethical AI Disclaimer */}
      <div style={{
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-md)",
        padding: "0.75rem 1rem",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.6rem",
        fontSize: "0.775rem",
        color: "var(--text-muted)"
      }}>
        <AlertCircle size={14} style={{ marginTop: "2px", flexShrink: 0 }} />
        <div>
          <strong style={{ color: "var(--text-secondary)" }}>Ethical Verification Notice: </strong>
          {disclaimer}
        </div>
      </div>
    </div>
  );
};
