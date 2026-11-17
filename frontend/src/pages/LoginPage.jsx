import React, { useState } from "react";
import { ShieldCheck, User, Wrench, Shield, Lock, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const LoginPage = ({ onNavigate }) => {
  const { login, register, quickSwitchRole } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    full_name: "",
    role: "citizen"
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        await register(formData);
      } else {
        await login(formData.username, formData.password);
      }
      onNavigate(formData.role === "admin" ? "admin-dashboard" : formData.role === "fixer" ? "fixer-dashboard" : "citizen-dashboard");
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (roleName) => {
    setError("");
    try {
      await quickSwitchRole(roleName);
      onNavigate(roleName === "admin" ? "admin-dashboard" : roleName === "fixer" ? "fixer-dashboard" : "citizen-dashboard");
    } catch (err) {
      setError(err.message || "Failed to switch role");
    }
  };

  return (
    <div style={{ maxWidth: "480px", margin: "2rem auto", padding: "1rem" }}>
      <div className="glass-card" style={{ padding: "2.5rem 2rem" }}>
        {/* Brand header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div className="sidebar-logo-icon" style={{ margin: "0 auto 1rem", width: "48px", height: "48px" }}>
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800 }}>
            CivicProof <span>AI</span>
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {isRegister ? "Create a verified municipal account" : "Sign in to access your civic verification portal"}
          </p>
        </div>

        {/* 1-Click Hackathon Quick Switcher Demo Cards */}
        <div style={{
          backgroundColor: "rgba(10, 20, 36, 0.7)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)",
          padding: "1rem",
          marginBottom: "1.75rem"
        }}>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--powder-blue)", fontWeight: 700, marginBottom: "0.75rem" }}>
            Instant Demo Logins (1-Click)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => handleQuickDemo("citizen")}
              className="btn btn-secondary btn-sm"
              style={{ flexDirection: "column", padding: "0.5rem 0.25rem", gap: "0.25rem" }}
            >
              <User size={16} color="var(--powder-blue)" />
              <span style={{ fontSize: "0.75rem" }}>Citizen</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("fixer")}
              className="btn btn-secondary btn-sm"
              style={{ flexDirection: "column", padding: "0.5rem 0.25rem", gap: "0.25rem" }}
            >
              <Wrench size={16} color="var(--accent-amber)" />
              <span style={{ fontSize: "0.75rem" }}>Fixer</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("admin")}
              className="btn btn-secondary btn-sm"
              style={{ flexDirection: "column", padding: "0.5rem 0.25rem", gap: "0.25rem" }}
            >
              <Shield size={16} color="var(--accent-purple)" />
              <span style={{ fontSize: "0.75rem" }}>Admin</span>
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "var(--radius-md)",
            padding: "0.75rem",
            color: "#fca5a5",
            fontSize: "0.85rem",
            marginBottom: "1.25rem"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Elena Rostova"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="name@civicproof.org"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Role</label>
                <select
                  className="form-select"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="citizen">Citizen / Reporter</option>
                  <option value="fixer">Repair Team / Contractor</option>
                  <option value="admin">Administrator / Human Auditor</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. citizen"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "1rem" }}
            disabled={loading}
          >
            {loading ? "Authenticating..." : isRegister ? "Create Account" : "Sign In to CivicProof"}
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--powder-blue)",
              fontSize: "0.85rem",
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            {isRegister ? "Already have an account? Sign in" : "Need an account? Register here"}
          </button>
        </div>
      </div>
    </div>
  );
};
