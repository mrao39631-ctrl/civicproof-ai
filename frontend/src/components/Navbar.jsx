import React from "react";
import { ShieldCheck, User, Wrench, Shield, LogOut, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Navbar = ({ onNavigate }) => {
  const { user, logout, quickSwitchRole, role } = useAuth();

  return (
    <header className="top-navbar">
      {/* Brand logo (visible on mobile if sidebar hidden) */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div className="sidebar-logo-icon" style={{ cursor: "pointer" }} onClick={() => onNavigate("landing")}>
          <ShieldCheck size={22} />
        </div>
        <div style={{ cursor: "pointer" }} onClick={() => onNavigate("landing")}>
          <div className="sidebar-logo-text" style={{ fontSize: "1.1rem" }}>
            CivicProof <span>AI</span>
          </div>
          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Independent Verification Engine
          </div>
        </div>
      </div>

      {/* Center: Quick Hackathon Demo Role Switcher */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        backgroundColor: "rgba(10, 20, 36, 0.7)",
        padding: "0.3rem 0.5rem",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-color)"
      }}>
        <span style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          color: "var(--text-muted)",
          padding: "0 0.4rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        }}>
          Demo Role:
        </span>

        {/* Citizen Role Switcher */}
        <button
          onClick={() => {
            quickSwitchRole("citizen");
            onNavigate("citizen-dashboard");
          }}
          style={{
            background: role === "citizen" ? "linear-gradient(135deg, #0284c7, #38bdf8)" : "transparent",
            color: role === "citizen" ? "#fff" : "var(--text-secondary)",
            border: "none",
            borderRadius: "var(--radius-md)",
            padding: "0.35rem 0.75rem",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            transition: "all 0.2s"
          }}
          title="Switch to Citizen / Reporter persona"
        >
          <User size={13} />
          <span>Citizen</span>
          {role === "citizen" && <CheckCircle2 size={12} />}
        </button>

        {/* Fixer Role Switcher */}
        <button
          onClick={() => {
            quickSwitchRole("fixer");
            onNavigate("fixer-dashboard");
          }}
          style={{
            background: role === "fixer" ? "linear-gradient(135deg, #d97706, #f59e0b)" : "transparent",
            color: role === "fixer" ? "#fff" : "var(--text-secondary)",
            border: "none",
            borderRadius: "var(--radius-md)",
            padding: "0.35rem 0.75rem",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            transition: "all 0.2s"
          }}
          title="Switch to Repair Contractor persona"
        >
          <Wrench size={13} />
          <span>Fixer</span>
          {role === "fixer" && <CheckCircle2 size={12} />}
        </button>

        {/* Admin Role Switcher */}
        <button
          onClick={() => {
            quickSwitchRole("admin");
            onNavigate("admin-dashboard");
          }}
          style={{
            background: role === "admin" ? "linear-gradient(135deg, #7c3aed, #a855f7)" : "transparent",
            color: role === "admin" ? "#fff" : "var(--text-secondary)",
            border: "none",
            borderRadius: "var(--radius-md)",
            padding: "0.35rem 0.75rem",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            transition: "all 0.2s"
          }}
          title="Switch to Municipal Administrator persona"
        >
          <Shield size={13} />
          <span>Admin</span>
          {role === "admin" && <CheckCircle2 size={12} />}
        </button>
      </div>

      {/* Right side: User profile & controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff" }}>
                {user.full_name}
              </div>
              <div style={{ fontSize: "0.725rem", color: "var(--text-powder)", textTransform: "capitalize" }}>
                Role: {user.role}
              </div>
            </div>

            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--powder-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--powder-blue)",
              fontWeight: 700,
              fontSize: "0.85rem"
            }}>
              {user.username.substring(0, 2).toUpperCase()}
            </div>

            <button
              onClick={logout}
              title="Logout"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "0.4rem",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center"
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate("login")}>
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
