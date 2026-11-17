import React from "react";
import { ShieldCheck, LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export const CommandNavbar = ({ activeTab, onTabChange, onLogout, onSwitchRole, currentPortal }) => {
  const { user, role } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const handleLogoutAction = () => {
    if (onLogout) onLogout();
    else if (onSwitchRole) onSwitchRole();
  };

  const getRoleBadge = () => {
    switch (role) {
      case "fixer":
        return { label: "CONTRACTOR TERMINAL", color: "var(--amber-primary)" };
      case "admin":
        return { label: "AUDITOR COMMAND", color: "var(--accent-purple)" };
      case "citizen":
      default:
        return { label: "CITIZEN PORTAL", color: "var(--accent-cyan)" };
    }
  };

  const badge = getRoleBadge();

  // Portal-specific center tabs
  const renderCenterTabs = () => {
    if (role === "citizen") {
      return (
        <div className="command-tabs">
          <button
            className={`command-tab-btn ${activeTab === "filing" ? "active" : ""}`}
            onClick={() => onTabChange("filing")}
          >
            Dashboard & Filing
          </button>
          <button
            className={`command-tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => onTabChange("history")}
          >
            My Reports & Ledger
          </button>
        </div>
      );
    }
    if (role === "fixer") {
      return (
        <div className="command-tabs">
          <button
            className={`command-tab-btn ${activeTab === "assigned" ? "active" : ""}`}
            onClick={() => onTabChange("assigned")}
          >
            Active Field Orders
          </button>
          <button
            className={`command-tab-btn ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => onTabChange("completed")}
          >
            Verified Completed
          </button>
        </div>
      );
    }
    if (role === "admin") {
      return (
        <div className="command-tabs">
          <button
            className={`command-tab-btn ${activeTab === "command" ? "active" : ""}`}
            onClick={() => onTabChange("command")}
          >
            Command Overview
          </button>
          <button
            className={`command-tab-btn ${activeTab === "disputes" ? "active" : ""}`}
            onClick={() => onTabChange("disputes")}
          >
            Disputes & Adjudication
          </button>
          <button
            className={`command-tab-btn ${activeTab === "ledger" ? "active" : ""}`}
            onClick={() => onTabChange("ledger")}
          >
            SHA-256 Ledger
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <header className="command-navbar">
      {/* Top / Left: Brand Section */}
      <div className="brand-section">
        <div className="brand-left-group">
          <div className="brand-logo-shield">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="brand-title">
              CivicProof <span>AI</span>
            </div>
          </div>
          <div className="portal-role-badge">
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: badge.color, display: "inline-block" }} />
            {badge.label}
          </div>
        </div>

        {/* Mobile-only Quick Controls (Theme + Logout) in top bar */}
        <div className="mobile-header-actions">
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle-btn"
            style={{ width: "32px", height: "32px" }}
            title={isDark ? "Switch to Crisp White Mode" : "Switch to Obsidian Dark Mode"}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={handleLogoutAction}
            className="btn btn-obsidian btn-sm"
            style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", borderColor: "rgba(239, 68, 68, 0.4)", color: "var(--accent-rose)" }}
            title="Logout"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>

      {/* Center: Portal-specific tab pills */}
      <div className="navbar-tabs-container">
        {renderCenterTabs()}
      </div>

      {/* Right / Desktop: User Avatar + Indian Name/Role + Theme Toggle + Global Logout */}
      <div className="user-telemetry-section desktop-only">
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
                {user.full_name}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--amber-primary)", fontFamily: "var(--font-mono)" }}>
                {role === "admin" ? "Chief Municipal Auditor" : role === "fixer" ? "Squad-07 Lead Contractor" : "Resident Reporter"}
              </div>
            </div>

            <div style={{
              width: "34px",
              height: "34px",
              borderRadius: "8px",
              backgroundColor: "var(--bg-card-hover)",
              border: "1px solid var(--border-amber)",
              color: "var(--amber-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: "0.8rem",
              boxShadow: "0 0 10px var(--amber-glow)"
            }}>
              {user.username.substring(0, 2).toUpperCase()}
            </div>

            {/* Dual Theme Switcher Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-obsidian btn-sm"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "34px",
                height: "34px",
                padding: 0,
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                color: isDark ? "var(--amber-primary)" : "#f59e0b",
                backgroundColor: "var(--bg-card)",
                cursor: "pointer"
              }}
              title={isDark ? "Switch to Crisp White Mode" : "Switch to Obsidian Dark Mode"}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Global Logout Button */}
            <button
              onClick={handleLogoutAction}
              className="btn btn-obsidian btn-sm"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.35rem 0.75rem",
                fontSize: "0.775rem",
                borderColor: "rgba(239, 68, 68, 0.4)",
                color: "var(--text-primary)",
                cursor: "pointer"
              }}
              title="Logout session and return to CivicProof AI Access Portal"
            >
              <LogOut size={14} color="var(--accent-rose)" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-obsidian btn-sm"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "34px",
                height: "34px",
                padding: 0,
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                color: isDark ? "var(--amber-primary)" : "#f59e0b",
                backgroundColor: "var(--bg-card)",
                cursor: "pointer"
              }}
              title={isDark ? "Switch to Crisp White Mode" : "Switch to Obsidian Dark Mode"}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="btn btn-amber btn-sm" onClick={handleLogoutAction}>
              Access Portal
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
