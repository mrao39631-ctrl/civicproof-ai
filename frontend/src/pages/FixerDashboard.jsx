import React, { useState, useEffect } from "react";
import { 
  Wrench, UploadCloud, CheckCircle2, Clock, MapPin, 
  ArrowUpRight, AlertCircle, RefreshCw, X, FileText 
} from "lucide-react";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

export const FixerDashboard = ({ onNavigate, onSelectComplaint }) => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("actionable"); // "actionable" or "all"

  // Evidence upload modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [afterPreview, setAfterPreview] = useState(null);
  const [repairNotes, setRepairNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    loadComplaints();
  }, [activeTab]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const data = await api.listComplaints();
      setComplaints(data);
    } catch (err) {
      console.error("Failed to load fixer complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (activeTab === "actionable") {
      return ["SUBMITTED", "IN_PROGRESS", "AI_NOT_VERIFIED", "DISPUTED"].includes(c.status);
    }
    return true;
  });

  const handleOpenUploadModal = (e, complaint) => {
    e.stopPropagation();
    setSelectedComplaint(complaint);
    setAfterPhoto(null);
    setAfterPreview(null);
    setRepairNotes("");
    setModalError("");
  };

  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setModalError("Please upload an image file (JPEG, PNG, WEBP).");
      return;
    }
    setModalError("");
    setAfterPhoto(file);
    setAfterPreview(URL.createObjectURL(file));
  };

  const handleUploadRepairEvidence = async (e) => {
    e.preventDefault();
    if (!afterPhoto) {
      setModalError("Please select the AFTER repair photo.");
      return;
    }
    if (!repairNotes.trim()) {
      setModalError("Please provide repair description notes.");
      return;
    }

    setUploading(true);
    setModalError("");

    try {
      const formData = new FormData();
      formData.append("after_photo", afterPhoto);
      formData.append("repair_notes", repairNotes);

      await api.uploadAfterEvidence(selectedComplaint.id, formData);
      setSelectedComplaint(null);
      await loadComplaints();
      // Navigate to complaint details to see the evidence & AI verification
      onSelectComplaint(selectedComplaint.id);
    } catch (err) {
      setModalError(err.message || "Failed to submit repair evidence.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        marginBottom: "2rem"
      }}>
        <div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800 }}>Contractor & Repair Portal</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Review assigned municipal issues, perform corrective maintenance, and upload verifiable proof photos.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={loadComplaints} title="Refresh work queue">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <button
          onClick={() => setActiveTab("actionable")}
          className={`btn ${activeTab === "actionable" ? "btn-primary" : "btn-secondary"}`}
          style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
        >
          <Clock size={16} />
          <span>Awaiting Repair / In Progress</span>
        </button>

        <button
          onClick={() => setActiveTab("all")}
          className={`btn ${activeTab === "all" ? "btn-primary" : "btn-secondary"}`}
          style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
        >
          <FileText size={16} />
          <span>All Dispatched Complaints</span>
        </button>
      </div>

      {/* Complaints Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        gap: "1.25rem"
      }}>
        {loading ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 0.75rem" }} />
            <div>Loading dispatched work orders...</div>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "4rem 2rem" }}>
            <CheckCircle2 size={40} color="var(--accent-emerald)" style={{ margin: "0 auto 1rem" }} />
            <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>Work Queue Clear</h3>
            <p style={{ color: "var(--text-muted)" }}>There are no active municipal defects currently awaiting repair evidence.</p>
          </div>
        ) : (
          filteredComplaints.map((item) => (
            <div
              key={item.id}
              className="glass-card glass-card-interactive"
              onClick={() => onSelectComplaint(item.id)}
              style={{ display: "flex", flexDirection: "column", cursor: "pointer" }}
            >
              {/* Card Photo Preview */}
              <div style={{
                height: "180px",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                position: "relative",
                marginBottom: "1rem",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)"
              }}>
                <img
                  src={item.before_image || "/uploads/seed_garbage_before.jpg"}
                  alt={item.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem" }}>
                  <StatusBadge status={item.status} />
                </div>
                <div style={{
                  position: "absolute",
                  bottom: "0.75rem",
                  right: "0.75rem",
                  backgroundColor: "rgba(15, 23, 42, 0.85)",
                  color: "var(--powder-blue)",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)"
                }}>
                  {item.complaint_code}
                </div>
              </div>

              {/* Title & details */}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  {item.category}
                </span>
                <h3 style={{ fontSize: "1.05rem", color: "#fff", margin: "0.25rem 0 0.5rem" }}>
                  {item.title}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.825rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                  <MapPin size={14} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.location}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                marginTop: "1rem",
                paddingTop: "1rem",
                borderTop: "1px solid var(--border-color)",
                display: "flex",
                gap: "0.5rem"
              }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={(e) => handleOpenUploadModal(e, item)}
                >
                  <UploadCloud size={14} />
                  <span>Upload Repair Photo</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onSelectComplaint(item.id)}
                >
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Repair Evidence Upload Modal */}
      {selectedComplaint && (
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
            maxWidth: "600px",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "var(--shadow-lg)"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Submit Repair Evidence</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--powder-blue)" }}>{selectedComplaint.complaint_code} — {selectedComplaint.category}</p>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUploadRepairEvidence} style={{ padding: "1.5rem", overflowY: "auto" }}>
              {modalError && (
                <div style={{
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.75rem",
                  color: "#fca5a5",
                  fontSize: "0.85rem",
                  marginBottom: "1rem"
                }}>
                  {modalError}
                </div>
              )}

              {/* Original Before Photo Reference */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label className="form-label">Reference: Original Citizen Photo</label>
                <div style={{
                  height: "120px",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  border: "1px solid var(--border-color)",
                  position: "relative"
                }}>
                  <img
                    src={selectedComplaint.before_image || "/uploads/seed_garbage_before.jpg"}
                    alt="Original Reference"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div style={{
                    position: "absolute",
                    bottom: "0.5rem",
                    left: "0.5rem",
                    backgroundColor: "rgba(239, 68, 68, 0.9)",
                    color: "#fff",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.5rem",
                    borderRadius: "4px"
                  }}>
                    ORIGINAL DEFECT (MATCH THIS SCENE)
                  </div>
                </div>
              </div>

              {/* AFTER Photo Upload */}
              <div className="form-group">
                <label className="form-label">Completed AFTER Repair Photo *</label>
                {!afterPreview ? (
                  <label className="dropzone" style={{ display: "block", padding: "1.5rem" }}>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleFileChange(e.target.files[0])}
                    />
                    <UploadCloud size={24} color="var(--powder-blue)" style={{ margin: "0 auto 0.5rem" }} />
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>
                      Upload AFTER repair photo
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Include adjacent sidewalk, curb or building landmarks so AI can verify location match
                    </div>
                  </label>
                ) : (
                  <div style={{
                    position: "relative",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    border: "1px solid var(--border-color)",
                    height: "180px",
                    backgroundColor: "#000"
                  }}>
                    <img
                      src={afterPreview}
                      alt="After Preview"
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setAfterPhoto(null);
                        setAfterPreview(null);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ position: "absolute", top: "0.5rem", right: "0.5rem" }}
                    >
                      Change Photo
                    </button>
                  </div>
                )}
              </div>

              {/* Repair Description Notes */}
              <div className="form-group">
                <label className="form-label">Repair Notes & Description *</label>
                <textarea
                  required
                  rows={3}
                  className="form-textarea"
                  placeholder="Detail work performed (e.g. Cleared 4 cubic yards of debris, sanitized pavement, asphalt rolled flush to municipal grade)..."
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedComplaint(null)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={uploading}
                >
                  {uploading ? "Hashing & Submitting..." : "Submit Proof & Trigger AI"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
