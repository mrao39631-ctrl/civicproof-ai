import React, { useState, useEffect } from "react";
import { Lock, RefreshCw, CheckCircle2, ShieldCheck, ArrowUpRight } from "lucide-react";
import { api } from "../services/api";
import { SecurityBadge } from "../components/SecurityBadge";

export const AuditHistoryPage = ({ onSelectComplaint }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("");

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs(100);
      setLogs(data);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!filterAction) return true;
    return log.action.includes(filterAction);
  });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)" }}>
              Cryptographic SHA-256 Municipal Ledger
            </h1>
            <span className="badge-obsidian badge-amber">IMMUTABLE CHAIN</span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
            Permanent non-repudiation log of civic complaints, photographic hashes, AI verdicts, and auditor overrides.
          </p>
        </div>

        <button onClick={loadAuditLogs} className="btn btn-obsidian btn-sm" style={{ gap: "0.4rem" }}>
          <RefreshCw size={13} /> Refresh Ledger
        </button>
      </div>

      {/* Trust Standards Strip */}
      <div className="obsidian-card" style={{ marginBottom: "1.5rem", backgroundColor: "var(--bg-card-hover)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", fontSize: "0.825rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
            <CheckCircle2 size={16} color="var(--amber-primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong style={{ color: "var(--text-primary)" }}>Cryptographic Non-Repudiation:</strong> Every citizen photo is fingerprinted with SHA-256 at upload. Swapping images is mathematically impossible.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
            <CheckCircle2 size={16} color="var(--amber-primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong style={{ color: "var(--text-primary)" }}>Role-Separated Authorization:</strong> Citizens verify physical completion; contractors upload repair evidence; auditors adjudicate disputes.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
            <CheckCircle2 size={16} color="var(--amber-primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong style={{ color: "var(--text-primary)" }}>Tamper-Evident History:</strong> Every status transition records actor ID, timestamp, and audit justification.
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {[
          { label: "All Events", value: "" },
          { label: "Complaint Ingestion", value: "COMPLAINT_FILED" },
          { label: "Contractor Uploads", value: "REPAIR" },
          { label: "AI Evaluations", value: "AI_VERIFICATION" },
          { label: "Citizen Decisions", value: "REPORTER" },
          { label: "Auditor Overrides", value: "ADMIN" }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterAction(tab.value)}
            className={`btn btn-sm ${filterAction === tab.value ? "btn-amber" : "btn-obsidian"}`}
            style={{ fontSize: "0.775rem", padding: "0.3rem 0.75rem" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ledger Feed */}
      <div className="obsidian-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            Loading ledger blocks...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 600 }}>No civic defects reported yet.</p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
              Submit a report to generate a SHA-256 ledger entry.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: "1rem 1.25rem",
                  borderBottom: "1px solid var(--border-color)",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "1.5rem"
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                    <span className="font-mono" style={{ fontSize: "0.775rem", color: "var(--amber-primary)", fontWeight: 700 }}>
                      {log.action}
                    </span>
                    <span className="badge-obsidian badge-amber" style={{ fontSize: "0.675rem" }}>
                      {log.actor_role.toUpperCase()}: {log.actor_name}
                    </span>
                    {log.old_status && log.new_status && (
                      <span style={{ fontSize: "0.725rem", color: "var(--text-muted)" }}>
                        {log.old_status} → <strong style={{ color: "#fff" }}>{log.new_status}</strong>
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: "0.825rem", color: "var(--text-primary)", margin: "0.25rem 0" }}>
                    {log.details}
                  </p>

                  {log.evidence_hash && (
                    <div style={{ marginTop: "0.35rem" }}>
                      <SecurityBadge hash={log.evidence_hash} />
                    </div>
                  )}
                </div>

                <div style={{ textAlign: "right", flexShrink: 0, fontSize: "0.725rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
