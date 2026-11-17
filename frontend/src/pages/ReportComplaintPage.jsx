import React, { useState } from "react";
import { 
  Camera, UploadCloud, MapPin, AlertCircle, ArrowLeft, 
  Check, FileText, Sparkles, Navigation 
} from "lucide-react";
import { api } from "../services/api";

export const ReportComplaintPage = ({ onNavigate, onComplaintCreated }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Garbage",
    location: ""
  });
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WEBP).");
      return;
    }
    setError("");
    setBeforePhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleMockGPS = () => {
    const locations = [
      "4th Street & Oak Ave, Westside District (GPS: 37.7749° N, 122.4194° W)",
      "Lincoln School Crosswalk, 12th Avenue (GPS: 37.7833° N, 122.4167° W)",
      "Market Street in front of Municipal Library (GPS: 37.7900° N, 122.4000° W)",
      "Maple Park North Gate entrance, Lamppost #412 (GPS: 37.7650° N, 122.4250° W)"
    ];
    const picked = locations[Math.floor(Math.random() * locations.length)];
    setFormData({ ...formData, location: picked });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!beforePhoto) {
      setError("Please upload an original BEFORE photo of the problem.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("category", formData.category);
      data.append("location", formData.location);
      data.append("before_photo", beforePhoto);

      const res = await api.createComplaint(data);
      if (onComplaintCreated) {
        onComplaintCreated(res.id);
      } else {
        onNavigate("citizen-dashboard");
      }
    } catch (err) {
      setError(err.message || "Failed to submit civic complaint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Back button */}
      <button
        onClick={() => onNavigate("citizen-dashboard")}
        style={{
          background: "none",
          border: "none",
          color: "var(--powder-blue)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.9rem",
          fontWeight: 600,
          marginBottom: "1.25rem"
        }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="glass-card" style={{ padding: "2.5rem" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800 }}>Report a Civic Defect</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.35rem" }}>
            Submit photographic evidence. A cryptographic SHA-256 hash will anchor this evidence against future alteration.
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "var(--radius-md)",
            padding: "0.85rem 1rem",
            color: "#fca5a5",
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1.5rem"
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Complaint Title *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Hazardous deep pothole causing car damage near school crosswalk"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Category & Location Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Garbage">Garbage / Waste Overflow</option>
                <option value="Road Damage">Road Damage / Pothole</option>
                <option value="Water Leakage">Water Leakage / Pipe Burst</option>
                <option value="Street Light">Street Light / Electrical</option>
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <label className="form-label" style={{ margin: 0 }}>Incident Location *</label>
                <button
                  type="button"
                  onClick={handleMockGPS}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--powder-blue)",
                    fontSize: "0.775rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem"
                  }}
                >
                  <Navigation size={12} /> Auto GPS Fill
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  required
                  className="form-input"
                  style={{ paddingLeft: "2.3rem" }}
                  placeholder="Street name, landmark, or intersection"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
                <MapPin size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Detailed Description *</label>
            <textarea
              required
              rows={4}
              className="form-textarea"
              placeholder="Describe the severity, duration, and any surrounding reference landmarks (e.g. utility pole, storefront, curb markers) to assist AI verification..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Original BEFORE Photo Upload */}
          <div className="form-group" style={{ marginTop: "1.5rem" }}>
            <label className="form-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Original Incident Photo (BEFORE Evidence) *</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>JPEG, PNG, WEBP up to 10MB</span>
            </label>

            {!previewUrl ? (
              <label className="dropzone" style={{ display: "block" }}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handleFileChange(e.target.files[0])}
                />
                <div style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(56, 189, 248, 0.1)",
                  color: "var(--powder-blue)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem"
                }}>
                  <UploadCloud size={26} />
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 600, color: "#fff", marginBottom: "0.35rem" }}>
                  Click or drag photo here to upload
                </div>
                <div style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>
                  Must show the problem clearly along with surrounding street landmarks
                </div>
              </label>
            ) : (
              <div style={{
                position: "relative",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                border: "1px solid var(--border-color)",
                maxHeight: "360px",
                backgroundColor: "#000"
              }}>
                <img
                  src={previewUrl}
                  alt="Before Preview"
                  style={{ width: "100%", height: "300px", objectFit: "contain", backgroundColor: "#0a1120" }}
                />
                <div style={{
                  position: "absolute",
                  bottom: "1rem",
                  left: "1rem",
                  backgroundColor: "rgba(239, 68, 68, 0.9)",
                  color: "#fff",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "0.3rem 0.75rem",
                  borderRadius: "var(--radius-sm)"
                }}>
                  ORIGINAL BEFORE EVIDENCE
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBeforePhoto(null);
                    setPreviewUrl(null);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ position: "absolute", top: "1rem", right: "1rem" }}
                >
                  Change Photo
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate("citizen-dashboard")}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ minWidth: "180px" }}
              disabled={loading}
            >
              {loading ? (
                <>Hashing & Registering...</>
              ) : (
                <>
                  <Check size={18} />
                  <span>Submit Complaint</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
