import React from "react";
import { 
  ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, 
  Cpu, Lock, Users, Sparkles, Scale, FileText, ChevronRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const LandingPage = ({ onNavigate }) => {
  const { quickSwitchRole } = useAuth();

  const handleLaunch = (role, page) => {
    quickSwitchRole(role);
    onNavigate(page);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Hero Section */}
      <section style={{
        textAlign: "center",
        padding: "3.5rem 1rem 3rem",
        position: "relative"
      }}>
        {/* Hackathon Badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          backgroundColor: "rgba(56, 189, 248, 0.1)",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          borderRadius: "9999px",
          padding: "0.35rem 1rem",
          fontSize: "0.825rem",
          color: "var(--powder-blue)",
          marginBottom: "1.5rem"
        }}>
          <Sparkles size={14} />
          <span style={{ fontWeight: 600 }}>Civic Integrity Hackathon Prototype 2026</span>
        </div>

        <h1 style={{
          fontSize: "3.2rem",
          fontWeight: 800,
          lineHeight: 1.15,
          color: "#fff",
          maxWidth: "900px",
          margin: "0 auto 1.5rem",
          letterSpacing: "-0.03em"
        }}>
          AI-Powered Independent Verification of <span style={{
            background: "linear-gradient(135deg, #38bdf8 0%, #7dd3fc 50%, #bae6fd 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>Civic Complaints</span>
        </h1>

        <p style={{
          fontSize: "1.2rem",
          color: "var(--text-secondary)",
          maxWidth: "760px",
          margin: "0 auto 2.5rem",
          lineHeight: 1.6
        }}>
          A public complaint should <strong style={{ color: "#fff" }}>never</strong> be marked as resolved just because an official or contractor uploads a photo. 
          CivicProof AI mathematically compares original incident evidence with repair claims to ensure honest governance.
        </p>

        {/* Action Buttons for Hackathon Personas */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          flexWrap: "wrap"
        }}>
          <button
            className="btn btn-primary"
            style={{ padding: "0.85rem 1.75rem", fontSize: "1rem" }}
            onClick={() => handleLaunch("citizen", "citizen-dashboard")}
          >
            <span>Launch Citizen Portal</span>
            <ArrowRight size={18} />
          </button>

          <button
            className="btn btn-secondary"
            style={{ padding: "0.85rem 1.75rem", fontSize: "1rem" }}
            onClick={() => handleLaunch("fixer", "fixer-dashboard")}
          >
            <span>Contractor / Fixer View</span>
          </button>

          <button
            className="btn btn-secondary"
            style={{ padding: "0.85rem 1.75rem", fontSize: "1rem", borderColor: "rgba(168, 85, 247, 0.4)" }}
            onClick={() => handleLaunch("admin", "admin-dashboard")}
          >
            <span>Auditor / Admin View</span>
          </button>
        </div>
      </section>

      {/* The Core Problem & Solution Cards */}
      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "1.5rem",
        margin: "2.5rem 0"
      }}>
        <div className="glass-card" style={{ borderLeft: "4px solid var(--accent-rose)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div style={{ padding: "0.5rem", borderRadius: "8px", background: "rgba(239, 68, 68, 0.15)", color: "var(--accent-rose)" }}>
              <AlertTriangle size={22} />
            </div>
            <h3 style={{ fontSize: "1.2rem" }}>The Status Quo Problem</h3>
          </div>
          <p style={{ fontSize: "0.925rem", lineHeight: 1.6 }}>
            City tracking systems automatically close complaints when contractors upload random photos—often showing unpaved potholes, loose gravel, or unrelated clean streets. 
            Citizens are left with unresolved hazards and zero recourse.
          </p>
        </div>

        <div className="glass-card" style={{ borderLeft: "4px solid var(--accent-emerald)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div style={{ padding: "0.5rem", borderRadius: "8px", background: "rgba(16, 185, 129, 0.15)", color: "var(--accent-emerald)" }}>
              <ShieldCheck size={22} />
            </div>
            <h3 style={{ fontSize: "1.2rem" }}>The CivicProof Solution</h3>
          </div>
          <p style={{ fontSize: "0.925rem", lineHeight: 1.6 }}>
            Multimodal AI correlates spatial landmarks between BEFORE and AFTER photos, verifies defect elimination, and enforces a mandatory Citizen Approval Gate. 
            Only the citizen reporter can officially close a case.
          </p>
        </div>
      </section>

      {/* 4 Architectural Pillars */}
      <section style={{ margin: "4rem 0" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Engineered for Transparency & Trust</h2>
          <p style={{ color: "var(--text-secondary)" }}>Zero blind trust. Four independent layers of verification.</p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.25rem"
        }}>
          {/* Pillar 1 */}
          <div className="glass-card">
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(56, 189, 248, 0.15)",
              color: "var(--powder-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.25rem"
            }}>
              <Cpu size={24} />
            </div>
            <h4 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Multimodal AI Vision</h4>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Powered by Google Gemini 2.5 Flash to inspect geometry, curb alignments, and perimeter asphalt compaction with explainable reasoning.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="glass-card">
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "var(--accent-emerald)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.25rem"
            }}>
              <Users size={24} />
            </div>
            <h4 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Citizen Approval Gate</h4>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              AI never closes tickets alone. The reporting citizen must confirm: "Yes, problem fixed" or "No, still exists", triggering automatic human escalation.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="glass-card">
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(168, 85, 247, 0.15)",
              color: "var(--accent-purple)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.25rem"
            }}>
              <Lock size={24} />
            </div>
            <h4 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Cryptographic SHA-256</h4>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Every submitted photo is fingerprinted with an immutable SHA-256 hash at upload time, preventing photo swapping or post-repair tampering.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="glass-card">
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(245, 158, 11, 0.15)",
              color: "var(--accent-amber)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.25rem"
            }}>
              <Scale size={24} />
            </div>
            <h4 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>Human Review Escalation</h4>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Disputed repairs or low AI confidence scores route immediately to municipal administrative review with complete audit logs.
            </p>
          </div>
        </div>
      </section>

      {/* 7-Step Hackathon Workflow Diagram */}
      <section className="glass-card" style={{ padding: "2.5rem" }}>
        <h3 style={{ fontSize: "1.4rem", marginBottom: "0.5rem", textAlign: "center" }}>
          End-to-End Civic Verification Workflow
        </h3>
        <p style={{ color: "var(--text-muted)", textAlign: "center", marginBottom: "2rem" }}>
          Step-by-step lifecycle from defect discovery to verified civic resolution
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "1rem",
          position: "relative"
        }}>
          {[
            { step: "01", title: "Report", desc: "Citizen uploads BEFORE photo" },
            { step: "02", title: "Dispatch", desc: "Repair crew receives case" },
            { step: "03", title: "Fix Evidence", desc: "Crew uploads AFTER photo" },
            { step: "04", title: "AI Audit", desc: "Gemini compares landmarks" },
            { step: "05", title: "Verdict", desc: "Fixed / Unverified result" },
            { step: "06", title: "Citizen Vote", desc: "Reporter confirms or disputes" },
            { step: "07", title: "Closed", desc: "Cryptographic ledger sealed" },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "1rem 0.75rem",
                textAlign: "center"
              }}
            >
              <div style={{
                fontSize: "0.75rem",
                fontWeight: 800,
                color: "var(--powder-blue)",
                marginBottom: "0.35rem"
              }}>
                STEP {item.step}
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>
                {item.title}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
