import React, { useState } from "react";
import { Lock, Copy, Check } from "lucide-react";

export const SecurityBadge = ({ hash, timestamp, label = "SHA-256 Hash" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncatedHash = hash ? `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}` : "Unavailable";

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      backgroundColor: "var(--bg-card-hover)",
      border: "1px solid var(--border-color)",
      borderRadius: "var(--radius-sm)",
      padding: "0.25rem 0.55rem",
      fontSize: "0.725rem",
      color: "var(--text-secondary)"
    }}>
      <Lock size={12} color="var(--amber-primary)" />
      <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>{label}:</span>
      <span className="font-mono" style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>{truncatedHash}</span>
      
      {hash && (
        <button
          onClick={handleCopy}
          title="Copy full cryptographic SHA-256 hash"
          style={{
            background: "none",
            border: "none",
            color: copied ? "var(--accent-emerald)" : "var(--text-muted)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            padding: "2px"
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      )}

      {timestamp && (
        <span style={{ color: "var(--text-muted)", borderLeft: "1px solid var(--border-color)", paddingLeft: "0.45rem" }}>
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
};
