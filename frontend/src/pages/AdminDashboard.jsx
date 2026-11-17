import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, CheckCircle2, XCircle, AlertTriangle, 
  FileText, ArrowUpRight, RefreshCw, Scale, Users, Check, X, Wrench
} from "lucide-react";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

export const AdminDashboard = ({ onNavigate, onSelectComplaint }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [allComplaints, setAllComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState("disputes"); // "disputes" or "all"
  const [loading, setLoading] = useState(true);

  // Override modal state
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [overrideNotes, setOverrideNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalAction, setModalAction] = useState("APPROVE"); // "APPROVE" or "REJECT" or "REQUEST_RE_REPAIR"

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, disputesData, complaintsData] = await Promise.all([
        api.getStats(),
        api.getDisputes(),
        api.listComplaints()
      ]);
      setStats(statsData);
      setDisputes(disputesData);
      setAllComplaints(complaintsData);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOverride = (e, dispute, action) => {
    e.stopPropagation();
    setSelectedDispute(dispute);
    setModalAction(action);
    setOverrideNotes("");
  };

  const handleExecuteOverride = async (e) => {
    e.preventDefault();
    if (!overrideNotes.trim()) return;

    setSubmitting(true);
    try {
      await api.adminOverride(selectedDispute.id, modalAction, overrideNotes);
      setSelectedDispute(null);
      await loadAdminData();
    } catch (err) {
      alert("Override failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        marginBottom: "2rem"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800 }}>Municipal Auditor & Admin Portal</h1>
            <span className="badge badge-purple">Human Authority</span>
          </div>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Oversee algorithmic verification, adjudicate citizen disputes, and inspect the tamper-evident municipal ledger.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={loadAdminData}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Metrics Row */}
      {stats && (
        <div className="metrics-grid">
          <div className="stat-card">
            <div>
              <div className="stat-val">{stats.total_complaints}</div>
              <div className="stat-label">Total City Complaints</div>
            </div>
            <div className="stat-icon-wrapper" style={{ backgroundColor: "rgba(56, 189, 248, 0.15)", color: "var(--powder-blue)" }}>
              <FileText size={22} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-val" style={{ color: "var(--accent-rose)" }}>{disputes.length}</div>
              <div className="stat-label">Disputed / Escalated</div>
            </div>
            <div className="stat-icon-wrapper" style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "var(--accent-rose)" }}>
              <ShieldAlert size={22} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-val" style={{ color: "var(--accent-emerald)" }}>{stats.verified_complaints}</div>
              <div className="stat-label">Verified Fixed</div>
            </div>
            <div className="stat-icon-wrapper" style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "var(--accent-emerald)" }}>
              <CheckCircle2 size={22} />
            </div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-val" style={{ color: "var(--powder-blue-light)" }}>{stats.pending_complaints}</div>
              <div className="stat-label">Active Workflows</div>
            </div>
            <div className="stat-icon-wrapper" style={{ backgroundColor: "rgba(56, 189, 248, 0.15)", color: "var(--powder-blue-light)" }}>
              <Scale size={22} />
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown Bar Visualizer */}
      {stats && stats.by_category && (
        <div className="glass-card" style={{ marginBottom: "1.75rem", padding: "1.25rem 1.5rem" }}>
          <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
            Municipal Incidents by Category
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {Object.entries(stats.by_category).map(([cat, count]) => (
              <div key={cat} style={{ backgroundColor: "var(--bg-secondary)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 600 }}>
                  <span>{cat}</span>
                  <span style={{ color: "var(--powder-blue)" }}>{count}</span>
                </div>
                <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255, 255, 255, 0.08)", borderRadius: "3px", marginTop: "0.5rem", overflow: "hidden" }}>
                  <div style={{
                    width: `${stats.total_complaints ? (count / stats.total_complaints) * 100 : 0}%`,
                    height: "100%",
                    backgroundColor: cat === "Garbage" ? "#10b981" : cat === "Road Damage" ? "#f59e0b" : cat === "Water Leakage" ? "#38bdf8" : "#a855f7"
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <button
          onClick={() => setActiveTab("disputes")}
          className={`btn ${activeTab === "disputes" ? "btn-primary" : "btn-secondary"}`}
          style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
        >
          <ShieldAlert size={16} />
          <span>Disputed & Flagged Queue ({disputes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("all")}
          className={`btn ${activeTab === "all" ? "btn-primary" : "btn-secondary"}`}
          style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
        >
          <FileText size={16} />
          <span>All Municipal Records ({allComplaints.length})</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <h3 style={{ fontSize: "1.1rem" }}>
            {activeTab === "disputes" ? "Human Adjudication & Dispute Queue" : "Comprehensive Complaint Ledger"}
          </h3>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            {activeTab === "disputes" ? "Cases where Citizen disagreed or AI flagged defects" : "Complete civic database"}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 0.75rem" }} />
            <div>Loading administrative queue...</div>
          </div>
        ) : (activeTab === "disputes" ? disputes : allComplaints).length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
            <CheckCircle2 size={40} color="var(--accent-emerald)" style={{ margin: "0 auto 1rem" }} />
            <h4 style={{ color: "#fff", marginBottom: "0.5rem" }}>Zero Outstanding Disputes</h4>
            <p style={{ color: "var(--text-muted)" }}>All civic complaints are either verified or progressing through standard workflows.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {(activeTab === "disputes" ? disputes : allComplaints).map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectComplaint(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1.25rem 1.5rem",
                  borderBottom: "1px solid var(--border-color)",
                  cursor: "pointer",
                  transition: "background 0.2s ease"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(56, 189, 248, 0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {/* Left info */}
                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: "70px",
                    height: "52px",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    flexShrink: 0
                  }}>
                    <img
                      src={item.before_image || "/uploads/seed_pothole_before.jpg"}
                      alt={item.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="font-mono" style={{ fontSize: "0.75rem", color: "var(--powder-blue)", fontWeight: 700 }}>
                        {item.complaint_code}
                      </span>
                      <span style={{ fontSize: "0.75rem", backgroundColor: "rgba(255, 255, 255, 0.08)", padding: "0.15rem 0.5rem", borderRadius: "4px", color: "var(--text-secondary)" }}>
                        {item.category}
                      </span>
                    </div>

                    <h4 style={{ fontSize: "1rem", color: "#fff", margin: "0.25rem 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.title}
                    </h4>

                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Reported by {item.citizen_name} • {item.location}
                    </div>
                  </div>
                </div>

                {/* Right actions */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0, marginLeft: "1rem" }}>
                  <StatusBadge status={item.status} />

                  {/* Quick Admin Actions if disputed */}
                  {item.status === "DISPUTED" && (
                    <div style={{ display: "flex", gap: "0.35rem" }}>
                      <button
                        className="btn btn-success btn-sm"
                        style={{ padding: "0.3rem 0.6rem" }}
                        title="Approve Resolution"
                        onClick={(e) => handleOpenOverride(e, item, "APPROVE")}
                      >
                        <Check size={13} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: "0.3rem 0.6rem" }}
                        title="Reject Repair Claim"
                        onClick={(e) => handleOpenOverride(e, item, "REJECT")}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}

                  <div style={{ color: "var(--powder-blue)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.85rem", fontWeight: 600 }}>
                    <span>Inspect</span>
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Human Review Override Modal */}
      {selectedDispute && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(3, 7, 18, 0.85)",
          backdropFilter: "blur(8px)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem"
        }}>
          <div style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-xl)",
            width: "100%",
            maxWidth: "540px",
            padding: "2rem",
            boxShadow: "var(--shadow-lg)"
          }}>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
              Human Auditor Decision: {modalAction === "APPROVE" ? "Official Approval" : modalAction === "REJECT" ? "Reject Repair Claim" : "Reopen For Re-Work"}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Case #{selectedDispute.complaint_code}: {selectedDispute.title}
            </p>

            <form onSubmit={handleExecuteOverride}>
              <div className="form-group">
                <label className="form-label">Mandatory Official Audit Justification *</label>
                <textarea
                  required
                  rows={4}
                  className="form-textarea"
                  placeholder="Provide detailed municipal reasoning for overriding or resolving this dispute..."
                  value={overrideNotes}
                  onChange={(e) => setOverrideNotes(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedDispute(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={modalAction === "APPROVE" ? "btn btn-success" : "btn btn-danger"}
                  disabled={submitting}
                >
                  {submitting ? "Anchoring Record..." : "Confirm & Anchor in Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
