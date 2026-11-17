import React, { useState, useEffect } from "react";
import { 
  PlusCircle, Filter, Search, ArrowUpRight, CheckCircle2, 
  Clock, AlertTriangle, FileText, MapPin, Eye, RefreshCw
} from "lucide-react";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

export const CitizenDashboard = ({ onNavigate, onSelectComplaint }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_complaints: 0,
    pending_complaints: 0,
    verified_complaints: 0,
    rejected_disputed_complaints: 0,
    by_category: {}
  });
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, [filterCategory, filterStatus]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, listData] = await Promise.all([
        api.getStats(),
        api.listComplaints({
          category: filterCategory || undefined,
          status: filterStatus || undefined,
          search: searchTerm || undefined
        })
      ]);
      setStats(statsData);
      setComplaints(listData);
    } catch (err) {
      console.error("Failed to load citizen dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadDashboardData();
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        marginBottom: "2rem"
      }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800 }}>Citizen Integrity Portal</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Monitor reported civic defects, review contractor evidence, and exercise your approval gate.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-secondary" onClick={loadDashboardData} title="Refresh data">
            <RefreshCw size={16} />
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate("report")}>
            <PlusCircle size={18} />
            <span>Report a Problem</span>
          </button>
        </div>
      </div>

      {/* 4 Main Metrics Cards */}
      <div className="metrics-grid">
        <div className="stat-card">
          <div>
            <div className="stat-val">{stats.total_complaints}</div>
            <div className="stat-label">Total Complaints</div>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: "rgba(56, 189, 248, 0.15)", color: "var(--powder-blue)" }}>
            <FileText size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-val" style={{ color: "var(--powder-blue-light)" }}>{stats.pending_complaints}</div>
            <div className="stat-label">Pending / In Progress</div>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: "rgba(56, 189, 248, 0.15)", color: "var(--powder-blue-light)" }}>
            <Clock size={22} />
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
            <div className="stat-val" style={{ color: "var(--accent-rose)" }}>{stats.rejected_disputed_complaints}</div>
            <div className="stat-label">Disputed / Unverified</div>
          </div>
          <div className="stat-icon-wrapper" style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", color: "var(--accent-rose)" }}>
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: "1rem 1.25rem", marginBottom: "1.75rem" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "1 1 240px", position: "relative" }}>
            <input
              type="text"
              placeholder="Search by title, location or code (e.g. CP-2026)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: "2.5rem" }}
            />
            <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          </div>

          <div style={{ minWidth: "160px" }}>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="form-select"
            >
              <option value="">All Categories</option>
              <option value="Garbage">Garbage</option>
              <option value="Road Damage">Road Damage</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Street Light">Street Light</option>
            </select>
          </div>

          <div style={{ minWidth: "160px" }}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-select"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Reported (New)</option>
              <option value="REPAIR_SUBMITTED">Repair Submitted</option>
              <option value="AI_VERIFIED_FIXED">AI: Verified Fixed</option>
              <option value="AI_NOT_VERIFIED">AI: Not Verified</option>
              <option value="DISPUTED">Disputed</option>
              <option value="CLOSED_VERIFIED">Closed — Verified</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            Filter
          </button>
        </form>
      </div>

      {/* Complaints List / Table */}
      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <h3 style={{ fontSize: "1.1rem" }}>Recent Complaint Activity</h3>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Showing {complaints.length} complaint{complaints.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 0.75rem" }} />
            <div>Loading verified municipal records...</div>
          </div>
        ) : complaints.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
            <FileText size={40} color="var(--border-highlight)" style={{ margin: "0 auto 1rem" }} />
            <h4 style={{ color: "#fff", marginBottom: "0.5rem" }}>No complaints match your filters</h4>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Report a new defect or clear filters to view existing cases.
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate("report")}>
              <PlusCircle size={14} /> Report First Problem
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {complaints.map((item) => (
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
                className="complaint-row"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(56, 189, 248, 0.03)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {/* Left thumbnail & basic info */}
                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", minWidth: 0, flex: 1 }}>
                  {/* Photo thumbnail */}
                  <div style={{
                    width: "72px",
                    height: "54px",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    flexShrink: 0
                  }}>
                    {item.before_image ? (
                      <img
                        src={item.before_image}
                        alt="Evidence"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                        <FileText size={18} />
                      </div>
                    )}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                      <span className="font-mono" style={{ fontSize: "0.75rem", color: "var(--powder-blue)", fontWeight: 600 }}>
                        {item.complaint_code}
                      </span>
                      <span style={{ fontSize: "0.75rem", backgroundColor: "rgba(255, 255, 255, 0.07)", padding: "0.15rem 0.5rem", borderRadius: "4px", color: "var(--text-secondary)" }}>
                        {item.category}
                      </span>
                    </div>

                    <h4 style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#fff",
                      margin: "0.25rem 0",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {item.title}
                    </h4>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      <MapPin size={13} />
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.location}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right status & action */}
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexShrink: 0, marginLeft: "1rem" }}>
                  <StatusBadge status={item.status} />
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
    </div>
  );
};
