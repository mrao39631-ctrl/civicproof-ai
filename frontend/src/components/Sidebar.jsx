import React from "react";
import { 
  ShieldCheck, LayoutDashboard, PlusCircle, Wrench, 
  ShieldAlert, ScrollText, Home, FileCheck, Layers
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Sidebar = ({ activePage, onNavigate }) => {
  const { role } = useAuth();

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header" style={{ cursor: "pointer" }} onClick={() => onNavigate("landing")}>
        <div className="sidebar-logo-icon">
          <ShieldCheck size={22} />
        </div>
        <div>
          <div className="sidebar-logo-text">
            CivicProof <span>AI</span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.04em" }}>
            Trust & Verification
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">Portals</div>

        <button
          className={`nav-link ${activePage === "citizen-dashboard" ? "active" : ""}`}
          onClick={() => onNavigate("citizen-dashboard")}
        >
          <LayoutDashboard size={18} />
          <span>Citizen Portal</span>
        </button>

        <button
          className={`nav-link ${activePage === "report" ? "active" : ""}`}
          onClick={() => onNavigate("report")}
        >
          <PlusCircle size={18} />
          <span>Report a Problem</span>
        </button>

        <button
          className={`nav-link ${activePage === "fixer-dashboard" ? "active" : ""}`}
          onClick={() => onNavigate("fixer-dashboard")}
        >
          <Wrench size={18} />
          <span>Fixer / Contractor</span>
        </button>

        <button
          className={`nav-link ${activePage === "admin-dashboard" ? "active" : ""}`}
          onClick={() => onNavigate("admin-dashboard")}
        >
          <ShieldAlert size={18} />
          <span>Admin & Disputes</span>
        </button>

        <div className="nav-section-title" style={{ marginTop: "1rem" }}>System Trust</div>

        <button
          className={`nav-link ${activePage === "audit-ledger" ? "active" : ""}`}
          onClick={() => onNavigate("audit-ledger")}
        >
          <ScrollText size={18} />
          <span>SHA-256 Audit Trail</span>
        </button>

        <button
          className={`nav-link ${activePage === "landing" ? "active" : ""}`}
          onClick={() => onNavigate("landing")}
        >
          <Layers size={18} />
          <span>Product Overview</span>
        </button>
      </nav>

      {/* Role Indicator Footer */}
      <div style={{
        padding: "1rem 1.25rem",
        borderTop: "1px solid var(--border-color)",
        backgroundColor: "rgba(10, 20, 36, 0.4)",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem"
      }}>
        <div style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          backgroundColor: role === "admin" ? "var(--accent-purple)" : role === "fixer" ? "var(--accent-amber)" : "var(--powder-blue)",
          boxShadow: "0 0 8px currentColor"
        }} />
        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          Signed in as: <strong style={{ color: "#fff", textTransform: "capitalize" }}>{role}</strong>
        </div>
      </div>
    </aside>
  );
};
