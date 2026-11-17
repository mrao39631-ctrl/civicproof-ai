import React, { useState } from "react";
import { 
  ShieldCheck, User, Wrench, Shield, Check, ArrowRight, 
  Sparkles, Lock, CheckCircle2, ChevronRight, Sun, Moon 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export const AccessPortalPage = ({ onRoleSelected }) => {
  const { login, register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [selectedRole, setSelectedRole] = useState("citizen");
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("citizen");
  const [password, setPassword] = useState("citizen123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const rolesConfig = [
    {
      id: "citizen",
      title: "Citizen / Resident",
      subtitle: "Report civic defects & approve or dispute AI-verified repairs",
      userDefault: "Aarav Sharma (Resident Reporter)",
      icon: <User size={22} color="var(--accent-cyan)" />,
      badge: "APPROVAL GATE AUTHORITY",
      badgeColor: "rgba(56, 189, 248, 0.15)",
      badgeBorder: "rgba(56, 189, 248, 0.3)"
    },
    {
      id: "fixer",
      title: "Field Contractor / Fixer",
      subtitle: "View assigned civic defects & upload AFTER repair evidence",
      userDefault: "Rajesh Verma (Lead Contractor, Squad-07)",
      icon: <Wrench size={22} color="var(--amber-primary)" />,
      badge: "SQUAD-07 FIELD TERMINAL",
      badgeColor: "rgba(245, 158, 11, 0.15)",
      badgeBorder: "rgba(245, 158, 11, 0.3)"
    },
    {
      id: "admin",
      title: "Municipal Auditor / Admin",
      subtitle: "Adjudicate disputes, inspect Before/After AI scores & SHA-256 ledger",
      userDefault: "Dr. Ananya Roy (Chief Municipal Auditor)",
      icon: <Shield size={22} color="var(--accent-purple)" />,
      badge: "COMMAND & ADJUDICATION",
      badgeColor: "rgba(168, 85, 247, 0.15)",
      badgeBorder: "rgba(168, 85, 247, 0.3)"
    }
  ];

  const handleRoleCardClick = (roleId) => {
    setSelectedRole(roleId);
    if (roleId === "citizen") {
      setUsername("citizen");
      setPassword("citizen123");
    } else if (roleId === "fixer") {
      setUsername("fixer");
      setPassword("fixer123");
    } else {
      setUsername("admin");
      setPassword("admin123");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        await register({
          username,
          password,
          email: `${username}@civicproof.in`,
          full_name: username === "citizen" ? "Aarav Sharma" : username === "fixer" ? "Rajesh Verma" : "Dr. Ananya Roy",
          role: selectedRole
        });
      } else {
        await login(username, password);
      }
      onRoleSelected(selectedRole);
    } catch (err) {
      setError(err.message || "Authentication failed. Try Quick Switch or check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
      position: "relative"
    }}>
      {/* Top Right Dual-Theme Switcher on Access Portal */}
      <div style={{ position: "absolute", top: "1.5rem", right: "1.5rem", zIndex: 10 }}>
        <button
          type="button"
          onClick={toggleTheme}
          className="btn btn-obsidian btn-sm"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.45rem 0.85rem",
            borderRadius: "8px",
            border: "1px solid var(--border-color)",
            color: isDark ? "var(--amber-primary)" : "#d97706",
            backgroundColor: "var(--bg-card)",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "0.8rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.15)"
          }}
          title={isDark ? "Switch to Crisp White Mode" : "Switch to Obsidian Dark Mode"}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
        </button>
      </div>

      <div className="obsidian-card" style={{
        maxWidth: "680px",
        width: "100%",
        padding: "2.5rem 2.25rem",
        border: "1px solid var(--border-amber)",
        boxShadow: "var(--shadow-card), 0 0 30px var(--amber-glow)"
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div className="brand-logo-shield" style={{ width: "52px", height: "52px", margin: "0 auto 1.25rem" }}>
            <ShieldCheck size={32} />
          </div>
          <h1 style={{ fontSize: "1.9rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
            CivicProof <span style={{ color: "var(--amber-primary)" }}>AI</span> Access Portal
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.925rem", marginTop: "0.35rem" }}>
            Enterprise Multimodal Civic Verification & Tamper-Evident Governance
          </p>
        </div>

        {/* Select Operating Role Header */}
        <div style={{ marginBottom: "1rem", color: "var(--text-secondary)", fontSize: "0.825rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Select Operating Role
        </div>

        {/* 3 Selectable Role Cards with Obsidian / Gold Active Borders */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.75rem" }}>
          {rolesConfig.map((r) => {
            const isSelected = selectedRole === r.id;
            return (
              <div
                key={r.id}
                onClick={() => handleRoleCardClick(r.id)}
                style={{
                  backgroundColor: isSelected ? "var(--amber-subtle)" : "var(--bg-card-hover)",
                  border: isSelected ? "2px solid var(--amber-primary)" : "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem 1.25rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: isSelected ? "0 0 20px var(--amber-glow)" : "none"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    backgroundColor: isSelected ? "var(--amber-subtle)" : "var(--bg-card)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1px solid ${isSelected ? "var(--amber-primary)" : "var(--border-color)"}`
                  }}>
                    {r.icon}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {r.title}
                      </span>
                      <span style={{
                        fontSize: "0.675rem",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        backgroundColor: r.badgeColor,
                        color: isSelected ? "var(--amber-primary)" : "var(--text-muted)",
                        border: `1px solid ${r.badgeBorder}`,
                        padding: "0.1rem 0.45rem",
                        borderRadius: "3px"
                      }}>
                        {r.badge}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                      {r.subtitle}
                    </div>
                  </div>
                </div>

                <div style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  border: isSelected ? "2px solid var(--amber-primary)" : "1px solid var(--border-color)",
                  backgroundColor: isSelected ? "var(--amber-primary)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0b0f17",
                  flexShrink: 0
                }}>
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div style={{
            backgroundColor: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            borderRadius: "var(--radius-md)",
            padding: "0.75rem",
            color: "#fca5a5",
            fontSize: "0.85rem",
            marginBottom: "1.25rem"
          }}>
            {error}
          </div>
        )}

        {/* Credentials Form (or Direct Enter) */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div>
              <label className="form-label">Username</label>
              <input
                type="text"
                required
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-amber"
            style={{ width: "100%", padding: "0.85rem", fontSize: "1rem" }}
            disabled={loading}
          >
            <span>{loading ? "Authenticating..." : `Enter ${rolesConfig.find(r => r.id === selectedRole)?.title}`}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1.5rem", fontSize: "0.825rem", color: "var(--text-muted)" }}>
          <span>Pre-loaded credentials active</span>
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            style={{ background: "none", border: "none", color: "var(--amber-primary)", cursor: "pointer", textDecoration: "underline" }}
          >
            {isRegister ? "Switch to Sign In" : "Register new account"}
          </button>
        </div>
      </div>
    </div>
  );
};
