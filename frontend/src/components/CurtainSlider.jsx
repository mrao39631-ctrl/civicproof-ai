import React, { useState, useRef, useEffect, useCallback } from "react";
import { Sliders, Columns, Maximize2, ShieldCheck, Lock } from "lucide-react";
import { SecurityBadge } from "./SecurityBadge";

export const CurtainSlider = ({
  beforeImg,
  afterImg,
  beforeHash,
  afterHash,
  defaultMode = "slider",
  height = "380px"
}) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [viewMode, setViewMode] = useState(defaultMode); // "slider" or "sideBySide"
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pos);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div style={{ width: "100%" }}>
      {/* View Switcher Pill Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "0.75rem",
        flexWrap: "wrap",
        gap: "0.5rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.775rem", fontWeight: 700, color: "var(--amber-primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Visual Comparison Mode:
          </span>
        </div>

        <div style={{
          display: "inline-flex",
          backgroundColor: "var(--bg-secondary)",
          borderRadius: "var(--radius-sm)",
          padding: "3px",
          border: "1px solid var(--border-color)"
        }}>
          <button
            type="button"
            onClick={() => setViewMode("slider")}
            style={{
              background: viewMode === "slider" ? "var(--amber-primary)" : "transparent",
              color: viewMode === "slider" ? "#0b0f17" : "var(--text-secondary)",
              border: "none",
              padding: "0.25rem 0.75rem",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.775rem",
              fontWeight: 700,
              transition: "all 0.2s"
            }}
          >
            <Sliders size={13} />
            <span>Curtain Slider</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("sideBySide")}
            style={{
              background: viewMode === "sideBySide" ? "var(--amber-primary)" : "transparent",
              color: viewMode === "sideBySide" ? "#0b0f17" : "var(--text-secondary)",
              border: "none",
              padding: "0.25rem 0.75rem",
              borderRadius: "4px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.775rem",
              fontWeight: 700,
              transition: "all 0.2s"
            }}
          >
            <Columns size={13} />
            <span>Side-by-Side</span>
          </button>
        </div>
      </div>

      {viewMode === "slider" ? (
        <div>
          {/* Draggable Curtain Slider Box */}
          <div
            ref={containerRef}
            className="curtain-slider-container"
            style={{ height }}
            onMouseDown={(e) => {
              setIsDragging(true);
              handleMove(e.clientX);
            }}
            onTouchStart={(e) => {
              setIsDragging(true);
              handleMove(e.touches[0].clientX);
            }}
          >
            {/* AFTER image (base background) */}
            <img
              src={afterImg || "/uploads/seed_pothole_after.jpg"}
              alt="Repair After"
              className="curtain-image-base"
            />

            {/* Top-Right Badge: AFTER */}
            <div style={{
              position: "absolute",
              top: "0.75rem",
              right: "0.75rem",
              backgroundColor: "rgba(16, 185, 129, 0.9)",
              color: "#fff",
              fontSize: "0.7rem",
              fontWeight: 800,
              padding: "0.25rem 0.65rem",
              borderRadius: "4px",
              letterSpacing: "0.06em",
              zIndex: 10,
              pointerEvents: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)"
            }}>
              AFTER — REPAIR PROOF
            </div>

            {/* BEFORE image (clipped overlay) */}
            <div
              className="curtain-image-overlay"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={beforeImg || "/uploads/seed_pothole_before.jpg"}
                alt="Original Before"
                style={{
                  width: containerRef.current ? `${containerRef.current.offsetWidth}px` : "100%",
                  height: "100%"
                }}
              />
              {/* Top-Left Badge: BEFORE */}
              <div style={{
                position: "absolute",
                top: "0.75rem",
                left: "0.75rem",
                backgroundColor: "rgba(239, 68, 68, 0.9)",
                color: "#fff",
                fontSize: "0.7rem",
                fontWeight: 800,
                padding: "0.25rem 0.65rem",
                borderRadius: "4px",
                letterSpacing: "0.06em",
                zIndex: 10,
                pointerEvents: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)"
              }}>
                BEFORE — ORIGINAL
              </div>
            </div>

            {/* Center Circular Amber Drag Handle (< >) */}
            <div
              className="curtain-handle"
              style={{ left: `${sliderPos}%` }}
            >
              <span>⟨⟩</span>
            </div>
          </div>

          {/* Slider Position Range Bar */}
          <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--accent-rose)", fontWeight: 700 }}>0% BEFORE</span>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              style={{
                flex: 1,
                accentColor: "var(--amber-primary)",
                cursor: "ew-resize"
              }}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--accent-emerald)", fontWeight: 700 }}>100% AFTER</span>
          </div>
        </div>
      ) : (
        /* Side-by-Side Mode */
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {/* Before */}
          <div style={{ backgroundColor: "#0d121d", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", overflow: "hidden" }}>
            <div style={{ position: "relative", height: "220px", backgroundColor: "#000" }}>
              <img
                src={beforeImg || "/uploads/seed_pothole_before.jpg"}
                alt="Original Before"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div style={{ position: "absolute", top: "0.5rem", left: "0.5rem", backgroundColor: "rgba(239, 68, 68, 0.9)", color: "#fff", fontSize: "0.7rem", fontWeight: 800, padding: "0.15rem 0.5rem", borderRadius: "3px" }}>
                BEFORE — ORIGINAL
              </div>
            </div>
            {beforeHash && (
              <div style={{ padding: "0.5rem 0.75rem" }}>
                <SecurityBadge hash={beforeHash} label="Before Hash" />
              </div>
            )}
          </div>

          {/* After */}
          <div style={{ backgroundColor: "#0d121d", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", overflow: "hidden" }}>
            <div style={{ position: "relative", height: "220px", backgroundColor: "#000" }}>
              <img
                src={afterImg || "/uploads/seed_pothole_after.jpg"}
                alt="Repair After"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div style={{ position: "absolute", top: "0.5rem", left: "0.5rem", backgroundColor: "rgba(16, 185, 129, 0.9)", color: "#fff", fontSize: "0.7rem", fontWeight: 800, padding: "0.15rem 0.5rem", borderRadius: "3px" }}>
                AFTER — REPAIR PROOF
              </div>
            </div>
            {afterHash && (
              <div style={{ padding: "0.5rem 0.75rem" }}>
                <SecurityBadge hash={afterHash} label="After Hash" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
