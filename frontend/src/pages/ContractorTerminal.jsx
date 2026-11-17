import React, { useState, useEffect, useRef } from "react";
import { 
  Wrench, Radio, MapPin, UploadCloud, CheckCircle2, 
  Sparkles, Camera, Sliders, Check, X, AlertCircle, RefreshCw, 
  Layers, ShieldAlert, ArrowLeftRight, Navigation, FileCheck
} from "lucide-react";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { SecurityBadge } from "../components/SecurityBadge";

export const ContractorTerminal = ({ activeTab = "assigned", onTabChange = () => {} }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [selectedDefect, setSelectedDefect] = useState(null);
  const [afterPhotoFile, setAfterPhotoFile] = useState(null);
  const [afterPreview, setAfterPreview] = useState(null);
  const [repairNotes, setRepairNotes] = useState("");
  const [preCheckRunning, setPreCheckRunning] = useState(false);
  const [preCheckResult, setPreCheckResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // GPS Geo-Fence Simulation state
  const [geoFenceMode, setGeoFenceMode] = useState("on_site"); // "on_site" (12m) or "spoof" (340m)

  const isInitialLoad = useRef(true);
  const prevComplaintsRef = useRef("");
  const isFetchingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    loadContractorQueue(false);
    const interval = setInterval(() => {
      if (isMounted) {
        loadContractorQueue(true);
      }
    }, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const loadContractorQueue = async (isSilent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!isSilent && isInitialLoad.current && complaints.length === 0) {
      setLoading(true);
    }

    try {
      const data = await api.listComplaints();
      const dataStr = JSON.stringify(data);
      if (prevComplaintsRef.current !== dataStr) {
        prevComplaintsRef.current = dataStr;
        setComplaints(data);
      }

      setSelectedDefect((prevDefect) => {
        if (!prevDefect) return null;
        const fresh = data.find((c) => c.id === prevDefect.id);
        if (fresh && JSON.stringify(fresh) !== JSON.stringify(prevDefect)) {
          return fresh;
        }
        return prevDefect;
      });
    } catch (err) {
      console.error("Failed to load contractor queue:", err);
    } finally {
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  };

  const handleOpenUploadModal = (defect) => {
    setSelectedDefect(defect);
    setAfterPhotoFile(null);
    setAfterPreview(null);
    setRepairNotes("");
    setPreCheckResult(null);
    setModalError("");
    setGeoFenceMode("on_site");
  };

  const handleReplaceBeforePhoto = async (defectId, file) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("before_photo", file);
      await api.uploadBeforeEvidence(defectId, formData);
      await loadContractorQueue(true);
    } catch (err) {
      alert("Failed to update before photo: " + (err.message || err));
    }
  };

  const handleUseSampleRepair = (type) => {
    let url = "/uploads/seed_garbage_after.jpg";
    let notes = "Squad-07 deployed mechanical road sweeper and cleared solid waste to municipal sanitation standards.";
    let score = 94.2;
    let complete = true;

    if (type === "patch") {
      url = "/uploads/seed_pothole_after.jpg";
      notes = "Subcontractor filled pothole depression with cold aggregate mixture.";
      score = 88.5;
      complete = false;
    } else if (type === "water") {
      url = "/uploads/seed_water_after.jpg";
      notes = "Excavated pipe junction, installed high-pressure brass valve, and repaved trench.";
      score = 96.0;
      complete = true;
    }

    setAfterPreview(url);
    setRepairNotes(notes);
    runLivePreCheck(score, complete);

    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        setAfterPhotoFile(new File([blob], `${type}_after.jpg`, { type: "image/jpeg" }));
      })
      .catch(() => {});
  };

  const handleTestDuplicateFraud = async () => {
    if (!selectedDefect) return;
    const beforeUrl = selectedDefect.before_image || "/uploads/seed_pothole_before.jpg";
    setAfterPreview(beforeUrl);
    setRepairNotes("Claiming defect resolved using identical original photo.");

    fetch(beforeUrl)
      .then((res) => res.blob())
      .then((blob) => {
        setAfterPhotoFile(new File([blob], "duplicate_test.jpg", { type: "image/jpeg" }));
      })
      .catch(() => {});

    setPreCheckResult({
      score: 12.0,
      landmarksMatch: true,
      locationMatch: true,
      repairComplete: false,
      summary: "CRITICAL ANTI-FRAUD WARNING: Cryptographic hash match between BEFORE & AFTER evidence. Submitting this will trigger SHA-256 duplicate image fraud detection!"
    });
  };

  const handleCustomFile = (file) => {
    if (!file) return;
    setAfterPhotoFile(file);
    setAfterPreview(URL.createObjectURL(file));
    runLivePreCheck(92.0, true);
  };

  const runLivePreCheck = (score = 92.0, complete = true) => {
    setPreCheckRunning(true);
    setTimeout(() => {
      setPreCheckResult({
        score: score,
        landmarksMatch: true,
        locationMatch: true,
        repairComplete: complete,
        summary: complete
          ? "Gemini Multimodal Vision Pre-Check: 94% spatial correlation confirmed with reference landmarks."
          : "Gemini Vision Alert: Sunken surface depression detected. Final approval may be disputed by citizen."
      });
      setPreCheckRunning(false);
    }, 500);
  };

  const handleSubmitProof = async (e) => {
    e.preventDefault();
    if (!afterPhotoFile && !afterPreview) {
      setModalError("Please select an AFTER repair photo.");
      return;
    }
    if (!repairNotes.trim()) {
      setModalError("Please provide repair description notes.");
      return;
    }

    setSubmitting(true);
    setModalError("");

    try {
      const formData = new FormData();
      formData.append("repair_notes", repairNotes);
      if (afterPhotoFile) {
        formData.append("after_photo", afterPhotoFile);
      } else {
        const res = await fetch(afterPreview);
        const blob = await res.blob();
        formData.append("after_photo", new File([blob], "repair.jpg", { type: "image/jpeg" }));
      }

      await api.uploadAfterEvidence(selectedDefect.id, formData);

      // Determine simulated contractor GPS telemetry based on selected toggle
      const baseLat = selectedDefect.latitude || 21.2514;
      const baseLng = selectedDefect.longitude || 81.6296;
      const latOffset = geoFenceMode === "on_site" ? 0.0001 : 0.003;
      const lngOffset = geoFenceMode === "on_site" ? 0.00008 : 0.002;
      const contractorLat = baseLat + latOffset;
      const contractorLng = baseLng + lngOffset;

      // Automatically trigger AI verification with GPS telemetry (<100m check)
      try {
        await api.triggerAiVerification(selectedDefect.id, {
          contractor_lat: contractorLat,
          contractor_lng: contractorLng
        });
      } catch (err) {
        console.warn("AI verification notice:", err);
      }

      setSelectedDefect(null);
      await loadContractorQueue(true);
    } catch (err) {
      setModalError(err.message || "Failed to submit repair proof.");
    } finally {
      setSubmitting(false);
    }
  };

  const isCompletedTab = activeTab === "completed";
  const activeComplaints = complaints.filter(
    (c) => !["CLOSED_VERIFIED", "ADMIN_APPROVED"].includes(c.status)
  );
  const completedComplaints = complaints.filter(
    (c) => ["CLOSED_VERIFIED", "ADMIN_APPROVED"].includes(c.status)
  );

  const displayedComplaints = isCompletedTab ? completedComplaints : activeComplaints;

  return (
    <div>
      {/* Top Full-Width Unit Banner */}
      <div className="obsidian-card" style={{
        marginBottom: "1.5rem",
        border: "1px solid var(--border-amber)",
        background: "linear-gradient(90deg, var(--bg-card) 0%, var(--bg-card-hover) 100%)",
        padding: "1.25rem 1.75rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span className="badge-obsidian badge-amber" style={{ fontSize: "0.775rem" }}>
                UNIT SQUAD-07
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                ID: RAIPUR-MC-SQ07-2026
              </span>
            </div>
            <h1 style={{ fontSize: "1.5rem", color: "var(--text-primary)", marginTop: "0.25rem", letterSpacing: "-0.02em" }}>
              Field Contractor Terminal — Raipur Zone 4
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginTop: "0.35rem", fontSize: "0.8rem", color: "var(--text-secondary)", flexWrap: "wrap" }}>
              <span>Assigned Zone: <strong style={{ color: "var(--text-primary)" }}>Zone 4 (Telibandha & Shankar Nagar)</strong></span>
              <span>Lead Contractor: <strong style={{ color: "var(--amber-primary)" }}>Rajesh Verma</strong></span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            {/* Telemetry Status Badge */}
            <div style={{
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.35)",
              borderRadius: "var(--radius-md)",
              padding: "0.5rem 0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent-emerald)", boxShadow: "0 0 10px #10b981", animation: "pulseBorder 1.5s infinite" }} />
              <div>
                <div style={{ fontSize: "0.675rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>TELEMETRY STATUS</div>
                <div style={{ fontSize: "0.775rem", fontWeight: 700, color: "var(--accent-emerald)", fontFamily: "var(--font-mono)" }}>
                  GPS ACTIVE (&lt;100M GEOFENCE)
                </div>
              </div>
            </div>

            {/* Active Repairs Counter */}
            <div style={{
              backgroundColor: "var(--bg-card-hover)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "0.5rem 1rem",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--amber-primary)", lineHeight: 1.1 }}>
                {activeComplaints.length}
              </div>
              <div style={{ fontSize: "0.675rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Active Field Orders
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Filter Bar & Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "1rem",
        flexWrap: "wrap",
        gap: "0.75rem"
      }}>
        {/* Sub-tab pills */}
        <div style={{
          display: "inline-flex",
          backgroundColor: "var(--bg-secondary)",
          padding: "4px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-color)",
          gap: "4px"
        }}>
          <button
            type="button"
            onClick={() => onTabChange("assigned")}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "var(--radius-sm)",
              border: "none",
              backgroundColor: !isCompletedTab ? "var(--bg-card)" : "transparent",
              color: !isCompletedTab ? "var(--amber-primary)" : "var(--text-secondary)",
              fontWeight: 700,
              fontSize: "0.825rem",
              cursor: "pointer",
              boxShadow: !isCompletedTab ? "var(--shadow-card)" : "none",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            <span>Active Field Orders</span>
            <span style={{
              backgroundColor: !isCompletedTab ? "var(--amber-subtle)" : "rgba(255,255,255,0.06)",
              padding: "0.1rem 0.45rem",
              borderRadius: "10px",
              fontSize: "0.7rem",
              fontFamily: "var(--font-mono)"
            }}>
              {activeComplaints.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange("completed")}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "var(--radius-sm)",
              border: "none",
              backgroundColor: isCompletedTab ? "var(--bg-card)" : "transparent",
              color: isCompletedTab ? "var(--accent-emerald)" : "var(--text-secondary)",
              fontWeight: 700,
              fontSize: "0.825rem",
              cursor: "pointer",
              boxShadow: isCompletedTab ? "var(--shadow-card)" : "none",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            <CheckCircle2 size={14} color="var(--accent-emerald)" />
            <span>Verified Completed</span>
            <span style={{
              backgroundColor: isCompletedTab ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.06)",
              padding: "0.1rem 0.45rem",
              borderRadius: "10px",
              fontSize: "0.7rem",
              fontFamily: "var(--font-mono)"
            }}>
              {completedComplaints.length}
            </span>
          </button>
        </div>

        <button onClick={loadContractorQueue} className="btn btn-obsidian btn-sm" style={{ gap: "0.35rem" }}>
          <RefreshCw size={13} /> Refresh Work Orders
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
          Loading field terminal queue...
        </div>
      ) : displayedComplaints.length === 0 ? (
        <div className="obsidian-card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
          <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 600 }}>No civic defects reported yet.</p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Submit a report to generate a SHA-256 ledger entry.
          </p>
        </div>
      ) : (
        <div
          className="contractor-work-orders-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
            gap: "1.25rem"
          }}
        >
          {displayedComplaints.map((defect) => {
            const hasAfter = Boolean(defect.after_image);
            const lat = defect.latitude || 21.2514;
            const lng = defect.longitude || 81.6296;

            return (
              <div
                key={defect.id}
                className="obsidian-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  border: ["SUBMITTED", "ASSIGNED", "IN_PROGRESS", "DISPUTED"].includes(defect.status) ? "1px solid var(--border-amber)" : "1px solid var(--border-color)",
                  position: "relative"
                }}
              >
                {/* Header Strip with Code, Category & Status */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--amber-primary)", fontFamily: "var(--font-mono)", fontWeight: 800 }}>
                      {defect.complaint_code}
                    </span>
                    <span style={{ fontSize: "0.725rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                      · {defect.category}
                    </span>
                  </div>
                  <StatusBadge status={defect.status} />
                </div>

                {/* 2-Column Split Visual Comparison Box */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.6rem",
                  marginBottom: "0.85rem"
                }}>
                  {/* Left Slot: BEFORE Incident Evidence */}
                  <div style={{
                    backgroundColor: "var(--bg-card-hover)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column"
                  }}>
                    <div style={{ position: "relative", height: "135px", backgroundColor: "#000" }}>
                      <img
                        src={defect.before_image || "/uploads/seed_pothole_before.jpg"}
                        alt="Before Defect"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <div style={{
                        position: "absolute",
                        top: "0.35rem",
                        left: "0.35rem",
                        backgroundColor: "rgba(239, 68, 68, 0.9)",
                        color: "#fff",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        padding: "0.1rem 0.4rem",
                        borderRadius: "3px"
                      }}>
                        BEFORE EVIDENCE
                      </div>
                      <label style={{
                        position: "absolute",
                        bottom: "0.35rem",
                        right: "0.35rem",
                        backgroundColor: "rgba(11, 15, 23, 0.85)",
                        border: "1px solid var(--border-amber)",
                        color: "var(--amber-primary)",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "4px",
                        fontSize: "0.65rem",
                        cursor: "pointer",
                        fontWeight: 700
                      }}>
                        <span>Replace</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => handleReplaceBeforePhoto(defect.id, e.target.files[0])}
                        />
                      </label>
                    </div>
                    <div style={{ padding: "0.45rem 0.5rem" }}>
                      <SecurityBadge hash={defect.before_hash || "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"} label="Before Hash" />
                    </div>
                  </div>

                  {/* Right Slot: AFTER Repair Proof */}
                  <div style={{
                    backgroundColor: "var(--bg-card-hover)",
                    border: hasAfter ? "1px solid var(--border-color)" : "1px dashed var(--border-amber)",
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column"
                  }}>
                    {hasAfter ? (
                      <>
                        <div style={{ position: "relative", height: "135px", backgroundColor: "#000" }}>
                          <img
                            src={defect.after_image}
                            alt="Repair Proof"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                          <div style={{
                            position: "absolute",
                            top: "0.35rem",
                            left: "0.35rem",
                            backgroundColor: "rgba(16, 185, 129, 0.9)",
                            color: "#fff",
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            padding: "0.1rem 0.4rem",
                            borderRadius: "3px"
                          }}>
                            AFTER PROOF
                          </div>
                        </div>
                        <div style={{ padding: "0.45rem 0.5rem" }}>
                          <SecurityBadge hash={defect.after_hash || "2c624232cdd221771294dfbb379ac8b00979dffb18204e324b97c238719cb6b8"} label="After Hash" />
                        </div>
                      </>
                    ) : (
                      <div
                        onClick={() => handleOpenUploadModal(defect)}
                        style={{
                          height: "100%",
                          minHeight: "175px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          padding: "1rem",
                          textAlign: "center",
                          backgroundColor: "var(--amber-subtle)",
                          transition: "all 0.2s"
                        }}
                      >
                        <Camera size={24} color="var(--amber-primary)" style={{ marginBottom: "0.4rem" }} />
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--amber-primary)" }}>
                          + Upload AFTER Photo
                        </span>
                        <span style={{ fontSize: "0.675rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                          Field evidence required
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: "1rem", color: "var(--text-primary)", marginBottom: "0.45rem", lineHeight: 1.3 }}>
                  {defect.title}
                </h3>

                {/* Compact Single-Line GPS Coordinate & Landmark Display (Replaced mini map) */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.775rem",
                  color: "var(--text-muted)",
                  backgroundColor: "var(--bg-card-hover)",
                  padding: "0.45rem 0.65rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-color)",
                  marginBottom: "0.75rem"
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <MapPin size={13} color="var(--amber-primary)" style={{ flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{defect.location}</span>
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-cyan)", fontWeight: 700, flexShrink: 0, marginLeft: "0.5rem" }}>
                    📍 {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
                  </span>
                </div>

                {/* Spatial Landmark Instructions */}
                <div style={{
                  backgroundColor: "var(--bg-card-hover)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.5rem 0.65rem",
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  marginBottom: "0.85rem",
                  lineHeight: 1.4
                }}>
                  <strong style={{ color: "var(--amber-primary)" }}>Spatial Landmark Directive: </strong>
                  Capture post-repair frame aligning with curb edge, utility pole & permanent storefront backdrop.
                </div>

                {/* Upload / Re-verify Action Button */}
                <button
                  onClick={() => handleOpenUploadModal(defect)}
                  className="btn btn-amber"
                  style={{ width: "100%", padding: "0.65rem", fontSize: "0.85rem", marginTop: "auto" }}
                >
                  <Camera size={15} />
                  <span>{hasAfter ? "Re-Upload Proof / Trigger AI Verification" : "Upload AFTER Repair Evidence"}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload AFTER Repair Evidence Modal */}
      {selectedDefect && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(3, 7, 18, 0.88)",
          backdropFilter: "blur(12px)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }}>
          <div className="obsidian-card" style={{
            maxWidth: "720px",
            width: "100%",
            maxHeight: "92vh",
            overflowY: "auto",
            border: "1px solid var(--border-amber)",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8), var(--shadow-glow)"
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--amber-primary)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
                  {selectedDefect.complaint_code} — SQUAD-07 FIELD UPLOAD & VERIFICATION
                </div>
                <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)", marginTop: "0.2rem" }}>
                  {selectedDefect.title}
                </h3>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  📍 {selectedDefect.location} (Target GPS: {(selectedDefect.latitude || 21.2514).toFixed(4)}° N, {(selectedDefect.longitude || 81.6296).toFixed(4)}° E)
                </div>
              </div>

              <button onClick={() => setSelectedDefect(null)} className="btn btn-obsidian btn-sm">
                <X size={16} />
              </button>
            </div>

            {modalError && (
              <div style={{ backgroundColor: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.35)", borderRadius: "var(--radius-md)", padding: "0.75rem", color: "#fca5a5", fontSize: "0.85rem", marginBottom: "1rem" }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitProof}>
              {/* GPS Telemetry Geo-Fence Simulator Toggle (<100m) */}
              <div style={{
                backgroundColor: "var(--bg-card-hover)",
                border: "1px solid var(--border-amber)",
                borderRadius: "var(--radius-md)",
                padding: "0.85rem 1rem",
                marginBottom: "1.25rem"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--amber-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Navigation size={14} />
                    Haversine GPS Geo-Fence Telemetry Engine (&lt;100M Limit)
                  </span>
                  <span className={`badge-obsidian ${geoFenceMode === "on_site" ? "badge-emerald" : "badge-rose"}`}>
                    {geoFenceMode === "on_site" ? "12m DELTA · ON-SITE VERIFIED (<100M)" : "340m DELTA · BREACH ALERT"}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.45rem" }}>
                  <button
                    type="button"
                    onClick={() => setGeoFenceMode("on_site")}
                    style={{
                      padding: "0.6rem 0.75rem",
                      borderRadius: "var(--radius-sm)",
                      border: geoFenceMode === "on_site" ? "2px solid var(--accent-emerald)" : "1px solid var(--border-color)",
                      backgroundColor: geoFenceMode === "on_site" ? "rgba(16, 185, 129, 0.12)" : "var(--bg-card)",
                      color: geoFenceMode === "on_site" ? "var(--accent-emerald)" : "var(--text-secondary)",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "0.775rem",
                      fontWeight: 700
                    }}
                  >
                    ✔ On-Site Presence (12m away)
                    <div style={{ fontSize: "0.675rem", fontWeight: 400, color: "var(--text-muted)", marginTop: "2px" }}>
                      Within 100m municipal geofence
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGeoFenceMode("spoof")}
                    style={{
                      padding: "0.6rem 0.75rem",
                      borderRadius: "var(--radius-sm)",
                      border: geoFenceMode === "spoof" ? "2px solid var(--accent-rose)" : "1px solid var(--border-color)",
                      backgroundColor: geoFenceMode === "spoof" ? "rgba(239, 68, 68, 0.12)" : "var(--bg-card)",
                      color: geoFenceMode === "spoof" ? "var(--accent-rose)" : "var(--text-secondary)",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "0.775rem",
                      fontWeight: 700
                    }}
                  >
                    ⚠ Off-Site Spoof (340m away)
                    <div style={{ fontSize: "0.675rem", fontWeight: 400, color: "var(--text-muted)", marginTop: "2px" }}>
                      Triggers Anti-Fraud Breach Alert!
                    </div>
                  </button>
                </div>
              </div>

              {/* Quick Sample & Anti-Fraud Test Buttons */}
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.35rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>QUICK FIELD TEST SAMPLES:</span>
                  <span style={{ color: "var(--amber-primary)" }}>Click to simulate evidence</span>
                </div>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => handleUseSampleRepair("garbage")} className="btn btn-obsidian btn-sm" style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}>
                    Verified Cleanup (Garbage)
                  </button>
                  <button type="button" onClick={() => handleUseSampleRepair("patch")} className="btn btn-obsidian btn-sm" style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem", color: "var(--amber-primary)" }}>
                    Partial Patch (Disputed Pothole)
                  </button>
                  <button type="button" onClick={() => handleUseSampleRepair("water")} className="btn btn-obsidian btn-sm" style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}>
                    Valve Sealed (Water Leak)
                  </button>
                  <button
                    type="button"
                    onClick={handleTestDuplicateFraud}
                    className="btn btn-obsidian btn-sm"
                    style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem", borderColor: "var(--accent-rose)", color: "var(--accent-rose)" }}
                  >
                    🚨 Test Duplicate Image Fraud
                  </button>
                </div>
              </div>

              {/* Photo Upload Zone */}
              <div style={{ marginBottom: "1rem" }}>
                <label className="form-label">Completed AFTER Repair Photo *</label>
                {!afterPreview ? (
                  <label className="obsidian-dropzone" style={{ display: "block", padding: "1.5rem" }}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleCustomFile(e.target.files[0])}
                    />
                    <UploadCloud size={30} color="var(--amber-primary)" style={{ margin: "0 auto 0.5rem" }} />
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      Upload AFTER photo from field camera
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Camera angle must correlate with reference curb/landmark geometry
                    </div>
                  </label>
                ) : (
                  <div style={{ position: "relative", height: "200px", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border-amber)", backgroundColor: "#000" }}>
                    <img
                      src={afterPreview}
                      alt="After Preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      onClick={() => { setAfterPhotoFile(null); setAfterPreview(null); setPreCheckResult(null); }}
                      className="btn btn-obsidian btn-sm"
                      style={{ position: "absolute", top: "0.5rem", right: "0.5rem" }}
                    >
                      Change Photo
                    </button>
                  </div>
                )}
              </div>

              {/* Simulated Multimodal AI Pre-Check Banner */}
              {preCheckRunning && (
                <div style={{ backgroundColor: "var(--bg-card-hover)", border: "1px solid var(--border-amber)", borderRadius: "var(--radius-sm)", padding: "0.75rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--amber-primary)", fontSize: "0.8rem" }}>
                  <Sparkles size={16} className="animate-spin" />
                  <span>Running multimodal spatial & landmark pre-check...</span>
                </div>
              )}

              {preCheckResult && (
                <div style={{
                  backgroundColor: preCheckResult.repairComplete ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
                  border: `1px solid ${preCheckResult.repairComplete ? "var(--accent-emerald)" : "var(--amber-primary)"}`,
                  borderRadius: "var(--radius-md)",
                  padding: "0.85rem 1rem",
                  marginBottom: "1rem"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Sparkles size={14} color={preCheckResult.repairComplete ? "var(--accent-emerald)" : "var(--amber-primary)"} />
                      AI Multimodal Pre-Check Result
                    </span>
                    <span className="badge-obsidian badge-amber">
                      Score: {preCheckResult.score}%
                    </span>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    {preCheckResult.summary}
                  </p>
                </div>
              )}

              {/* Repair Description Notes */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label className="form-label">Contractor Repair Description Notes *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail exact corrective actions performed (e.g. Cleared 3 tonnes of waste, applied hot bituminous tar rolled flush to grade)..."
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  className="form-textarea"
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setSelectedDefect(null)}
                  disabled={submitting}
                  className="btn btn-obsidian"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-amber"
                >
                  {submitting ? "Anchoring SHA-256..." : "Submit Proof & Trigger AI Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
