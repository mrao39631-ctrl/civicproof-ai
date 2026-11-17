import React, { useState } from "react";
import { X, Sliders, Columns, Maximize2, ShieldCheck } from "lucide-react";
import { SecurityBadge } from "./SecurityBadge";

export const ImageCompareModal = ({ isOpen, onClose, beforeImg, afterImg, beforeHash, afterHash, title }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [viewMode, setViewMode] = useState("slider"); // "slider" or "sideBySide"

  if (!isOpen) return null;

  return (
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
        maxWidth: "960px",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
      }}>
        {/* Header */}
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Visual Evidence Inspector</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{title || "Compare Before & After Repair"}</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              display: "flex",
              backgroundColor: "var(--bg-primary)",
              borderRadius: "var(--radius-md)",
              padding: "3px",
              border: "1px solid var(--border-color)"
            }}>
              <button
                onClick={() => setViewMode("slider")}
                style={{
                  background: viewMode === "slider" ? "rgba(56, 189, 248, 0.2)" : "transparent",
                  color: viewMode === "slider" ? "var(--powder-blue)" : "var(--text-secondary)",
                  border: "none",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.8rem",
                  fontWeight: 600
                }}
              >
                <Sliders size={14} /> Split Slider
              </button>
              <button
                onClick={() => setViewMode("sideBySide")}
                style={{
                  background: viewMode === "sideBySide" ? "rgba(56, 189, 248, 0.2)" : "transparent",
                  color: viewMode === "sideBySide" ? "var(--powder-blue)" : "var(--text-secondary)",
                  border: "none",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.8rem",
                  fontWeight: 600
                }}
              >
                <Columns size={14} /> Side-by-Side
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "0.5rem",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Comparison Body */}
        <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
          {viewMode === "slider" ? (
            <div>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "460px",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "#000",
                  userSelect: "none"
                }}
              >
                {/* AFTER image (base background) */}
                <img
                  src={afterImg}
                  alt="After Repair"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    backgroundColor: "#0a1120"
                  }}
                />
                <div style={{
                  position: "absolute",
                  bottom: "1rem",
                  right: "1rem",
                  backgroundColor: "rgba(16, 185, 129, 0.85)",
                  color: "#fff",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "0.25rem 0.65rem",
                  borderRadius: "var(--radius-sm)",
                  letterSpacing: "0.05em",
                  pointerEvents: "none"
                }}>
                  REPAIR AFTER
                </div>

                {/* BEFORE image (clipped overlay) */}
                <div
                  style={{
                    position: "absolute",
                    inset: "0 auto 0 0",
                    width: `${sliderPos}%`,
                    height: "100%",
                    overflow: "hidden",
                    borderRight: "2px solid #38bdf8",
                    boxShadow: "0 0 15px rgba(56, 189, 248, 0.5)"
                  }}
                >
                  <img
                    src={beforeImg}
                    alt="Original Before"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: "100%",
                      height: "100%",
                      maxWidth: "none",
                      objectFit: "contain",
                      backgroundColor: "#0a1120"
                    }}
                  />
                  <div style={{
                    position: "absolute",
                    bottom: "1rem",
                    left: "1rem",
                    backgroundColor: "rgba(239, 68, 68, 0.85)",
                    color: "#fff",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "0.25rem 0.65rem",
                    borderRadius: "var(--radius-sm)",
                    letterSpacing: "0.05em",
                    pointerEvents: "none"
                  }}>
                    ORIGINAL BEFORE
                  </div>
                </div>

                {/* Split line handle */}
                <div
                  style={{
                    position: "absolute",
                    left: `calc(${sliderPos}% - 14px)`,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: "#38bdf8",
                    color: "#070d18",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 12px rgba(56, 189, 248, 0.8)",
                    pointerEvents: "none"
                  }}
                >
                  <Sliders size={14} />
                </div>
              </div>

              {/* Slider Controller */}
              <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--accent-rose)", fontWeight: 600 }}>BEFORE</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPos}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  style={{
                    flex: 1,
                    accentColor: "var(--powder-blue)",
                    cursor: "ew-resize"
                  }}
                />
                <span style={{ fontSize: "0.8rem", color: "var(--accent-emerald)", fontWeight: 600 }}>AFTER</span>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div>
                <div style={{
                  position: "relative",
                  height: "360px",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "#000"
                }}>
                  <img
                    src={beforeImg}
                    alt="Original Before"
                    style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#0a1120" }}
                  />
                  <div style={{
                    position: "absolute",
                    top: "1rem",
                    left: "1rem",
                    backgroundColor: "rgba(239, 68, 68, 0.9)",
                    color: "#fff",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "0.25rem 0.65rem",
                    borderRadius: "var(--radius-sm)"
                  }}>
                    ORIGINAL BEFORE
                  </div>
                </div>
                <div style={{ marginTop: "0.5rem" }}>
                  <SecurityBadge hash={beforeHash} label="Before Hash" />
                </div>
              </div>

              <div>
                <div style={{
                  position: "relative",
                  height: "360px",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "#000"
                }}>
                  <img
                    src={afterImg}
                    alt="Repair After"
                    style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#0a1120" }}
                  />
                  <div style={{
                    position: "absolute",
                    top: "1rem",
                    left: "1rem",
                    backgroundColor: "rgba(16, 185, 129, 0.9)",
                    color: "#fff",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "0.25rem 0.65rem",
                    borderRadius: "var(--radius-sm)"
                  }}>
                    REPAIR AFTER
                  </div>
                </div>
                <div style={{ marginTop: "0.5rem" }}>
                  <SecurityBadge hash={afterHash} label="After Hash" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div style={{
          padding: "1rem 1.5rem",
          backgroundColor: "var(--bg-primary)",
          borderTop: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "0.8rem",
          color: "var(--text-muted)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShieldCheck size={16} color="var(--powder-blue)" />
            <span>Cryptographic integrity verified via SHA-256 evidence anchoring</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
