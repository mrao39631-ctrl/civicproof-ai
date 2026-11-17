import React, { useState, useEffect, useRef } from "react";
import { 
  Lightbulb, AlertOctagon, Droplets, Trash2, MapPin, 
  UploadCloud, FileCheck, CheckCircle2, Clock, AlertTriangle, 
  Search, Sliders, Check, X, ShieldAlert, Sparkles, Navigation, Lock,
  RefreshCw, ArrowRight, Eye, ShieldCheck, Copy, Shield, Filter
} from "lucide-react";
import confetti from "canvas-confetti";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import { SecurityBadge } from "../components/SecurityBadge";
import { PinDropMap } from "../components/PinDropMap";
import { CurtainSlider } from "../components/CurtainSlider";

export const CitizenPortal = ({ activeTab = "filing", onTabChange = () => {} }) => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    total_complaints: 0,
    pending_complaints: 0,
    verified_complaints: 0,
    rejected_disputed_complaints: 0
  });
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Form State
  const [category, setCategory] = useState("Road Damage");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState(21.2514);
  const [longitude, setLongitude] = useState(81.6296);
  const [description, setDescription] = useState("");
  const [beforeFile, setBeforeFile] = useState(null);
  const [beforePreview, setBeforePreview] = useState(null);
  const [simulatedHash, setSimulatedHash] = useState("9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08");
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState("");
  const [formError, setFormError] = useState("");

  // Inspect & Verify Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // History Tab Filters & Audit Logs State
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilterAction, setAuditFilterAction] = useState("");
  const [copiedHash, setCopiedHash] = useState(null);

  // Categories config
  const categories = [
    { id: "Pothole / Road", label: "Pothole / Road", icon: <AlertOctagon size={20} /> },
    { id: "Road Damage", label: "Pothole / Road", icon: <AlertOctagon size={20} /> },
    { id: "Street Light", label: "Street Light", icon: <Lightbulb size={20} /> },
    { id: "Water Leakage", label: "Water Leakage", icon: <Droplets size={20} /> },
    { id: "Garbage", label: "Garbage Overflow", icon: <Trash2 size={20} /> }
  ];

  // Pre-configured Raipur GPS locations
  const raipurLandmarks = [
    { name: "GE Road, Opposite Telibandha Lake Promenade, Raipur", lat: 21.2395, lng: 81.6624 },
    { name: "Sector 2 Commercial Complex, Shankar Nagar, Raipur", lat: 21.2542, lng: 81.6661 },
    { name: "Telibandha Marine Drive Promenade, Pier 3, Raipur", lat: 21.2415, lng: 81.6580 },
    { name: "GE Road & Ring Road Junction, AIIMS Flyover, Raipur", lat: 21.2568, lng: 81.5792 }
  ];

  const isInitialLoad = useRef(true);
  const prevStatsRef = useRef("");
  const prevComplaintsRef = useRef("");
  const isFetchingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    loadCitizenData(false);
    const interval = setInterval(() => {
      if (isMounted) {
        loadCitizenData(true);
      }
    }, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fresh Fetch on Tab Switch: Whenever citizen switches to 'history' tab, immediately fetch
  useEffect(() => {
    if (activeTab === "history") {
      loadCitizenData(true);
      loadAuditLogs();
    }
  }, [activeTab]);

  const loadCitizenData = async (isSilent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!isSilent && isInitialLoad.current && complaints.length === 0) {
      setLoading(true);
    }

    try {
      const [statsData, listData] = await Promise.all([
        api.getStats(),
        api.listComplaints({ my_only: true })
      ]);

      const statsStr = JSON.stringify(statsData);
      if (prevStatsRef.current !== statsStr) {
        prevStatsRef.current = statsStr;
        setStats(statsData);
      }

      const listStr = JSON.stringify(listData);
      if (prevComplaintsRef.current !== listStr) {
        prevComplaintsRef.current = listStr;
        setComplaints(listData);
      }

      setSelectedComplaint((prevSelected) => {
        if (!prevSelected) return null;
        const fresh = listData.find((c) => c.id === prevSelected.id);
        if (fresh && JSON.stringify(fresh) !== JSON.stringify(prevSelected)) {
          return fresh;
        }
        return prevSelected;
      });
    } catch (err) {
      console.error("Failed to load citizen data:", err);
    } finally {
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const data = await api.getAuditLogs(100);
      setAuditLogs(data || []);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleFreshSync = async () => {
    setSyncing(true);
    try {
      const [statsData, listData, logsData] = await Promise.all([
        api.getStats(),
        api.listComplaints({ my_only: true }),
        api.getAuditLogs(100)
      ]);
      setStats(statsData);
      setComplaints(listData);
      setAuditLogs(logsData || []);
      prevStatsRef.current = JSON.stringify(statsData);
      prevComplaintsRef.current = JSON.stringify(listData);
    } catch (err) {
      console.error("Fresh sync failed:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyHash = (hash) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2200);
  };

  const handleDetectGPS = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          setLatitude(lat);
          setLongitude(lng);
          setLocation(`Current GPS Location (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`);
        },
        () => {
          const picked = raipurLandmarks[Math.floor(Math.random() * raipurLandmarks.length)];
          setLocation(picked.name);
          setLatitude(picked.lat);
          setLongitude(picked.lng);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      const picked = raipurLandmarks[Math.floor(Math.random() * raipurLandmarks.length)];
      setLocation(picked.name);
      setLatitude(picked.lat);
      setLongitude(picked.lng);
    }
  };

  const handlePinLocationChange = (newLat, newLng) => {
    setLatitude(newLat);
    setLongitude(newLng);
    if (!location) {
      setLocation(`Raipur (${newLat.toFixed(4)}° N, ${newLng.toFixed(4)}° E)`);
    }
  };

  const handleLoadSamplePhoto = async (sampleType) => {
    let sampleUrl = "/uploads/seed_pothole_before.jpg";
    let sampleTitle = "Hazardous asphalt crater on GE Road near lake promenade";
    let sampleDesc = "14-inch deep pavement fracture causing two-wheelers to swerve into oncoming traffic.";
    let sampleCat = "Road Damage";
    let hash = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8";
    let lat = 21.2568;
    let lng = 81.5792;
    let loc = "AIIMS Junction, GE Road, Raipur";

    if (sampleType === "garbage") {
      sampleUrl = "/uploads/seed_garbage_before.jpg";
      sampleTitle = "Commercial produce waste accumulation at Shankar Nagar market";
      sampleDesc = "Unsanitary waste bags obstructing pedestrian crossing and sidewalk.";
      sampleCat = "Garbage";
      hash = "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a";
      lat = 21.2542;
      lng = 81.6661;
      loc = "Shankar Nagar Main Road Market, Raipur";
    } else if (sampleType === "water") {
      sampleUrl = "/uploads/seed_water_before.jpg";
      sampleTitle = "Subsurface drinking water pipeline eruption flooding Marine Drive";
      sampleDesc = "Potable water gushing from pipeline valve box onto promenade roadway.";
      sampleCat = "Water Leakage";
      hash = "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d";
      lat = 21.2395;
      lng = 81.6624;
      loc = "Marine Drive, Telibandha, Raipur";
    } else if (sampleType === "light") {
      sampleUrl = "/uploads/seed_light_before.jpg";
      sampleTitle = "Damaged wiring on high-mast streetlight pole #42 at promenade";
      sampleDesc = "Dangerous exposed electrical conduits and dark pedestrian path.";
      sampleCat = "Street Light";
      hash = "8f434346648f6b96df89dda901c5176b10e6d059612d559c499db38ce0ad02d1";
      lat = 21.2415;
      lng = 81.6580;
      loc = "Telibandha Lake Promenade, Raipur";
    }

    setCategory(sampleCat);
    setTitle(sampleTitle);
    setDescription(sampleDesc);
    setBeforePreview(sampleUrl);
    setSimulatedHash(hash);
    setLatitude(lat);
    setLongitude(lng);
    setLocation(loc);

    try {
      const res = await fetch(sampleUrl);
      const blob = await res.blob();
      const file = new File([blob], `${sampleType}_sample.jpg`, { type: "image/jpeg" });
      setBeforeFile(file);
    } catch {
      // fallback
    }
  };

  const handleFileChange = (file) => {
    if (!file) return;
    setBeforeFile(file);
    setBeforePreview(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.onload = async (e) => {
      const buffer = e.target.result;
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      setSimulatedHash(hashHex);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!beforeFile && !beforePreview) {
      setFormError("Please upload or load a sample BEFORE defect photo.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      const data = new FormData();
      data.append("title", title);
      data.append("description", description);
      data.append("category", category);
      data.append("location", location);
      data.append("latitude", latitude.toString());
      data.append("longitude", longitude.toString());
      
      // Explicitly associate logged-in user so complaint is never orphaned
      if (user?.id) {
        data.append("citizen_id", user.id.toString());
      }
      if (user?.username) {
        data.append("citizen_username", user.username);
      }

      if (beforeFile) {
        data.append("before_photo", beforeFile);
      } else {
        const res = await fetch(beforePreview);
        const blob = await res.blob();
        data.append("before_photo", new File([blob], "defect.jpg", { type: "image/jpeg" }));
      }

      await api.createComplaint(data);
      setFormSuccess("Defect filed successfully with SHA-256 anchor!");
      setTitle("");
      setDescription("");
      setLocation("");
      setBeforeFile(null);
      setBeforePreview(null);
      await loadCitizenData(true);
    } catch (err) {
      setFormError(err.message || "Failed to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenInspect = async (complaintId) => {
    try {
      const details = await api.getComplaint(complaintId);
      setSelectedComplaint(details);
      setDetailModalOpen(true);
      setFeedbackNotes("");
    } catch (err) {
      alert("Could not load details: " + err.message);
    }
  };

  const handleReporterAction = async (decision) => {
    setActionLoading(true);
    try {
      const updated = await api.submitReporterDecision(selectedComplaint.id, decision, feedbackNotes);
      setSelectedComplaint(updated);
      await loadCitizenData(true);

      if (decision === "AGREED_FIXED") {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      alert("Action failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter complaints for history tab
  const filteredComplaints = complaints.filter((item) => {
    if (statusFilter === "CLOSED") {
      if (!["CLOSED_VERIFIED", "ADMIN_APPROVED"].includes(item.status)) return false;
    } else if (statusFilter === "ACTIVE") {
      if (["CLOSED_VERIFIED", "ADMIN_APPROVED"].includes(item.status)) return false;
    } else if (statusFilter === "DISPUTED") {
      if (!["DISPUTED", "AI_NOT_VERIFIED", "AI_INSUFFICIENT_EVIDENCE"].includes(item.status)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = (item.complaint_code || "").toLowerCase().includes(q);
      const matchTitle = (item.title || "").toLowerCase().includes(q);
      const matchLoc = (item.location || "").toLowerCase().includes(q);
      const matchCat = (item.category || "").toLowerCase().includes(q);
      if (!matchCode && !matchTitle && !matchLoc && !matchCat) return false;
    }

    return true;
  });

  // Filter audit logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!auditFilterAction) return true;
    return (log.action || "").includes(auditFilterAction);
  });

  return (
    <div>
      {/* 
        ===================================================================
        TAB 1: DASHBOARD & DEFECT FILING VIEW (activeTab === 'filing')
        ===================================================================
      */}
      {activeTab === "filing" && (
        <>
          {/* Top 4 Compact KPI Strip */}
          <div className="kpi-strip">
            <div className="kpi-card">
              <div>
                <div className="kpi-value">{stats.total_complaints}</div>
                <div className="kpi-label">Total Logged</div>
              </div>
              <div className="kpi-icon-box" style={{ color: "var(--amber-primary)" }}>
                <FileCheck size={22} />
              </div>
            </div>

            <div className="kpi-card">
              <div>
                <div className="kpi-value" style={{ color: "var(--amber-light)" }}>{stats.pending_complaints}</div>
                <div className="kpi-label">Pending Repair</div>
              </div>
              <div className="kpi-icon-box" style={{ color: "var(--amber-light)", backgroundColor: "rgba(251, 191, 36, 0.1)" }}>
                <Clock size={22} />
              </div>
            </div>

            <div className="kpi-card">
              <div>
                <div className="kpi-value" style={{ color: "var(--accent-emerald)" }}>{stats.verified_complaints}</div>
                <div className="kpi-label">AI Verified Fixed</div>
              </div>
              <div className="kpi-icon-box" style={{ color: "var(--accent-emerald)", backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
                <CheckCircle2 size={22} />
              </div>
            </div>

            <div className="kpi-card">
              <div>
                <div className="kpi-value" style={{ color: "var(--accent-rose)" }}>{stats.rejected_disputed_complaints}</div>
                <div className="kpi-label">Disputed Repairs</div>
              </div>
              <div className="kpi-icon-box" style={{ color: "var(--accent-rose)", backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                <AlertTriangle size={22} />
              </div>
            </div>
          </div>

          {/* 2-Column Split Layout */}
          <div className="citizen-2col-layout" style={{ display: "grid", gap: "1.75rem", alignItems: "start" }}>
            
            {/* LEFT COLUMN: Report a Civic Defect Form */}
            <div className="obsidian-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>Report a Civic Defect</span>
                    <span className="badge-obsidian badge-amber">Field Ingestion</span>
                  </h2>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                    Anchor photographic incident evidence with SHA-256 non-repudiation
                  </p>
                </div>
              </div>

              {formSuccess && (
                <div style={{ backgroundColor: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.4)", borderRadius: "var(--radius-md)", padding: "0.75rem", color: "#34d399", fontSize: "0.85rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CheckCircle2 size={16} /> {formSuccess}
                </div>
              )}

              {formError && (
                <div style={{ backgroundColor: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.4)", borderRadius: "var(--radius-md)", padding: "0.75rem", color: "#fca5a5", fontSize: "0.85rem", marginBottom: "1rem" }}>
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmitComplaint}>
                {/* Category Cards Picker */}
                <label className="form-label">1. Defect Category</label>
                <div className="category-grid">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`category-card-select ${category === cat.id ? "selected" : ""}`}
                    >
                      <div style={{ color: category === cat.id ? "var(--amber-primary)" : "var(--text-muted)" }}>
                        {cat.icon}
                      </div>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: category === cat.id ? "var(--text-primary)" : "var(--text-secondary)" }}>
                        {cat.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Title */}
                <div style={{ marginBottom: "1rem" }}>
                  <label className="form-label">2. Defect Headline</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hazardous 14-inch asphalt crater near Telibandha Lake promenade"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="form-input"
                  />
                </div>

                {/* Location & GPS Button */}
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.45rem" }}>
                    <label className="form-label" style={{ margin: 0 }}>3. Landmark & Coordinates</label>
                    <button
                      type="button"
                      onClick={handleDetectGPS}
                      className="btn btn-obsidian btn-sm"
                      style={{ padding: "0.2rem 0.5rem", fontSize: "0.725rem", gap: "0.3rem", color: "var(--accent-cyan)" }}
                      title="Detect GPS from device or select Raipur landmark"
                    >
                      <Navigation size={12} /> Use My Current Location
                    </button>
                  </div>
                  <div style={{ position: "relative", marginBottom: "0.65rem" }}>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GE Road, Telibandha Promenade, Raipur"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: "2.2rem" }}
                    />
                    <MapPin size={15} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--amber-primary)" }} />
                  </div>

                  {/* Interactive Raipur Leaflet Pin-Drop Map */}
                  <PinDropMap
                    latitude={latitude}
                    longitude={longitude}
                    onLocationChange={handlePinLocationChange}
                    height="175px"
                  />
                </div>

                {/* Description */}
                <div style={{ marginBottom: "1rem" }}>
                  <label className="form-label">4. Defect Description & Visual Reference Landmarks</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe physical dimensions and permanent reference landmarks (curb markers, utility pole numbers, storefronts) for AI alignment..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-textarea"
                  />
                </div>

                {/* BEFORE Photo Drag-and-Drop & Clickable Test Samples */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.45rem" }}>
                    <label className="form-label" style={{ margin: 0 }}>5. Photographic Evidence (BEFORE)</label>
                    <span style={{ fontSize: "0.725rem", color: "var(--text-muted)" }}>SHA-256 Hashing Active</span>
                  </div>

                  {/* Sample Photo Clickable Test Buttons */}
                  <div style={{ display: "flex", gap: "0.35rem", marginBottom: "0.65rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.725rem", color: "var(--amber-primary)", alignSelf: "center", fontWeight: 700 }}>Test Samples:</span>
                    <button type="button" onClick={() => handleLoadSamplePhoto("pothole")} className="btn btn-obsidian btn-sm" style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }}>
                      Pothole Sample
                    </button>
                    <button type="button" onClick={() => handleLoadSamplePhoto("garbage")} className="btn btn-obsidian btn-sm" style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }}>
                      Garbage Sample
                    </button>
                    <button type="button" onClick={() => handleLoadSamplePhoto("water")} className="btn btn-obsidian btn-sm" style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }}>
                      Water Leak Sample
                    </button>
                    <button type="button" onClick={() => handleLoadSamplePhoto("light")} className="btn btn-obsidian btn-sm" style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem" }}>
                      Street Light Sample
                    </button>
                  </div>

                  {!beforePreview ? (
                    <label className="obsidian-dropzone" style={{ display: "block" }}>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) => handleFileChange(e.target.files[0])}
                      />
                      <UploadCloud size={28} color="var(--amber-primary)" style={{ margin: "0 auto 0.5rem" }} />
                      <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        Drop original incident photo here or click to browse
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                        Include adjacent pavement or curb landmarks for multimodal AI alignment
                      </div>
                    </label>
                  ) : (
                    <div style={{ position: "relative", height: "180px", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border-amber)", backgroundColor: "#000" }}>
                      <img
                        src={beforePreview}
                        alt="Before Evidence Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button
                        type="button"
                        onClick={() => { setBeforeFile(null); setBeforePreview(null); }}
                        className="btn btn-obsidian btn-sm"
                        style={{ position: "absolute", top: "0.5rem", right: "0.5rem" }}
                      >
                        Change Photo
                      </button>
                    </div>
                  )}

                  {/* Real-time SHA-256 Hash Preview */}
                  <div style={{ marginTop: "0.75rem", backgroundColor: "var(--bg-input)", border: "1px solid var(--border-color)", padding: "0.6rem 0.85rem", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Lock size={14} color="var(--accent-cyan)" />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Evidence SHA-256 Hash:</span>
                    <span className="font-mono" style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {simulatedHash}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-amber"
                  style={{ width: "100%", padding: "0.85rem", fontSize: "0.95rem" }}
                  disabled={submitting}
                >
                  <Lock size={16} />
                  <span>{submitting ? "Hashing & Anchoring..." : "Submit Defect with SHA-256 Anchor"}</span>
                </button>
              </form>
            </div>

            {/* RIGHT COLUMN: My Complaint & Verification History */}
            <div className="obsidian-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", color: "var(--text-primary)" }}>
                    My Complaint & Verification History
                  </h2>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                    Exercise Citizen Approval Gate: You have sole authority to confirm repair
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    onClick={() => onTabChange("history")}
                    className="btn btn-obsidian btn-sm"
                    style={{ fontSize: "0.75rem", color: "var(--amber-primary)", borderColor: "rgba(245, 158, 11, 0.4)", gap: "0.3rem" }}
                  >
                    <span>View Full Ledger</span> <ArrowRight size={13} />
                  </button>
                  <span className="badge-obsidian badge-cyan">
                    {complaints.length} Records
                  </span>
                </div>
              </div>

              {loading ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                  Loading verification history...
                </div>
              ) : complaints.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
                  <FileCheck size={36} color="var(--text-muted)" style={{ margin: "0 auto 0.75rem" }} />
                  <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 600 }}>No civic defects reported yet.</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                    Submit a report to generate a SHA-256 ledger entry.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {complaints.map((item) => {
                    const isClosed = ["CLOSED_VERIFIED", "ADMIN_APPROVED"].includes(item.status);
                    return (
                      <div
                        key={item.id}
                        style={{
                          backgroundColor: "var(--bg-input)",
                          border: isClosed ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid var(--border-color)",
                          borderRadius: "var(--radius-md)",
                          padding: "1.1rem",
                          transition: "border-color 0.2s"
                        }}
                      >
                        {/* Top line: Code, Category, Status Badge */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span className="font-mono" style={{ fontSize: "0.775rem", color: "var(--amber-primary)", fontWeight: 700 }}>
                              {item.complaint_code}
                            </span>
                            <span style={{ fontSize: "0.725rem", backgroundColor: "rgba(255, 255, 255, 0.05)", padding: "0.15rem 0.45rem", borderRadius: "3px", color: "var(--text-secondary)" }}>
                              {item.category}
                            </span>
                          </div>
                          {isClosed ? (
                            <span className="badge-obsidian badge-emerald" style={{ fontWeight: 800 }}>
                              <CheckCircle2 size={11} /> CLOSED - VERIFIED FIXED
                            </span>
                          ) : (
                            <StatusBadge status={item.status} />
                          )}
                        </div>

                        <h3 style={{ fontSize: "0.975rem", color: "var(--text-primary)", margin: "0.5rem 0 0.35rem", lineHeight: 1.3 }}>
                          {item.title}
                        </h3>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.775rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                          <MapPin size={13} color="var(--amber-primary)" />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.location}
                          </span>
                        </div>

                        {/* Status Progression: REPORTED -> ASSIGNED -> AFTER UPLOAD -> VERIFIED FIXED */}
                        <div style={{ backgroundColor: "var(--bg-card-hover)", borderRadius: "var(--radius-sm)", padding: "0.6rem 0.85rem", border: "1px solid var(--border-color)", marginBottom: "0.75rem" }}>
                          <div className="progression-stepper">
                            <div className="step-node completed">
                              <div className="step-circle"><Check size={11} /></div>
                              <span>REPORTED</span>
                            </div>
                            <div className={`step-node ${["ASSIGNED", "IN_PROGRESS", "REPAIR_SUBMITTED", "AI_VERIFIED_FIXED", "AI_NOT_VERIFIED", "CLOSED_VERIFIED", "ADMIN_APPROVED", "DISPUTED"].includes(item.status) ? "completed" : "active"}`}>
                              <div className="step-circle">
                                {["ASSIGNED", "IN_PROGRESS", "REPAIR_SUBMITTED", "AI_VERIFIED_FIXED", "AI_NOT_VERIFIED", "CLOSED_VERIFIED", "ADMIN_APPROVED", "DISPUTED"].includes(item.status) ? <Check size={11} /> : "2"}
                              </div>
                              <span>ASSIGNED</span>
                            </div>
                            <div className={`step-node ${["REPAIR_SUBMITTED", "AI_VERIFIED_FIXED", "AI_NOT_VERIFIED", "CLOSED_VERIFIED", "ADMIN_APPROVED"].includes(item.status) ? "completed" : item.status === "DISPUTED" ? "active" : ""}`}>
                              <div className="step-circle">
                                {["REPAIR_SUBMITTED", "AI_VERIFIED_FIXED", "AI_NOT_VERIFIED", "CLOSED_VERIFIED", "ADMIN_APPROVED"].includes(item.status) ? <Check size={11} /> : "3"}
                              </div>
                              <span>AFTER UPLOAD</span>
                            </div>
                            <div className={`step-node ${isClosed ? "completed" : ["AI_VERIFIED_FIXED", "AI_NOT_VERIFIED", "DISPUTED"].includes(item.status) ? "active" : ""}`}>
                              <div className="step-circle">
                                {isClosed ? <Check size={11} /> : "4"}
                              </div>
                              <span>VERIFIED FIXED</span>
                            </div>
                          </div>
                        </div>

                        {/* Action row: Inspect & Verify Button */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem" }}>
                          <span style={{ fontSize: "0.725rem", color: "var(--text-muted)" }}>
                            Contractor: <strong style={{ color: "var(--amber-light)" }}>{item.fixer_name || "Squad-07 Dispatch"}</strong>
                          </span>

                          <button
                            onClick={() => handleOpenInspect(item.id)}
                            className="btn btn-obsidian btn-sm"
                            style={{ color: "var(--amber-light)", borderColor: "rgba(245, 158, 11, 0.4)", gap: "0.35rem" }}
                          >
                            <Sliders size={13} />
                            <span>Inspect & Verify</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 
        ===================================================================
        TAB 2: MY REPORTS & AUDIT LEDGER VIEW (activeTab === 'history')
        ===================================================================
      */}
      {activeTab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          
          {/* Header & Controls Strip */}
          <div className="obsidian-card" style={{ padding: "1.25rem 1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                    My Reports & Cryptographic Audit Ledger
                  </h1>
                  <span className="badge-obsidian badge-amber">LIVE SYNC ACTIVE</span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.825rem", marginTop: "0.25rem" }}>
                  All citizen reports anchored with non-repudiation SHA-256 hashes, Before/After verification proofs, and immutable municipal ledger transitions.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <button
                  onClick={handleFreshSync}
                  disabled={syncing}
                  className="btn btn-obsidian btn-sm"
                  style={{ gap: "0.4rem", color: "var(--amber-primary)", borderColor: "rgba(245, 158, 11, 0.4)" }}
                  title="Immediately pull fresh complaints and ledger entries from backend"
                >
                  <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
                  <span>{syncing ? "Syncing..." : "Fresh Live Sync"}</span>
                </button>
                <button
                  onClick={() => onTabChange("filing")}
                  className="btn btn-amber btn-sm"
                  style={{ gap: "0.4rem" }}
                >
                  <span>Report New Defect</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* Quick KPI Counters */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.85rem", marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
              <div style={{ backgroundColor: "var(--bg-input)", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "0.725rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Total Reports Logged</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.2rem" }}>{complaints.length}</div>
              </div>
              <div style={{ backgroundColor: "var(--bg-input)", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                <div style={{ fontSize: "0.725rem", color: "var(--accent-emerald)", textTransform: "uppercase", fontWeight: 600 }}>Closed — Verified Fixed</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--accent-emerald)", marginTop: "0.2rem" }}>
                  {complaints.filter(c => ["CLOSED_VERIFIED", "ADMIN_APPROVED"].includes(c.status)).length}
                </div>
              </div>
              <div style={{ backgroundColor: "var(--bg-input)", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                <div style={{ fontSize: "0.725rem", color: "var(--amber-light)", textTransform: "uppercase", fontWeight: 600 }}>Active Field Orders</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--amber-light)", marginTop: "0.2rem" }}>
                  {complaints.filter(c => !["CLOSED_VERIFIED", "ADMIN_APPROVED"].includes(c.status)).length}
                </div>
              </div>
              <div style={{ backgroundColor: "var(--bg-input)", padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "0.725rem", color: "var(--accent-cyan)", textTransform: "uppercase", fontWeight: 600 }}>Ledger Audit Events</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--accent-cyan)", marginTop: "0.2rem" }}>{auditLogs.length}</div>
              </div>
            </div>
          </div>

          {/* Section 1: Detailed Complaints List with Before/After Evidence & SHA-256 Anchors */}
          <div className="obsidian-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileCheck size={18} color="var(--amber-primary)" />
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  Filed Defects & Resolution Evidence
                </h2>
                <span className="badge-obsidian badge-cyan" style={{ fontSize: "0.725rem" }}>
                  {filteredComplaints.length} Shown
                </span>
              </div>

              {/* Status Filters & Search */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <div style={{ position: "relative", minWidth: "200px" }}>
                  <Search size={13} style={{ position: "absolute", left: "0.65rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    placeholder="Search by code, title, location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input"
                    style={{ padding: "0.3rem 0.65rem 0.3rem 1.85rem", fontSize: "0.75rem" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "0.25rem" }}>
                  {[
                    { label: "All", value: "ALL" },
                    { label: "Closed Fixed", value: "CLOSED" },
                    { label: "Active", value: "ACTIVE" },
                    { label: "Disputed", value: "DISPUTED" }
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setStatusFilter(filter.value)}
                      className={`btn btn-sm ${statusFilter === filter.value ? "btn-amber" : "btn-obsidian"}`}
                      style={{ fontSize: "0.725rem", padding: "0.25rem 0.65rem" }}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                Loading citizen complaints and ledger...
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
                <FileCheck size={36} color="var(--text-muted)" style={{ margin: "0 auto 0.75rem" }} />
                <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 600 }}>No civic defects reported yet.</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  Submit a report to generate a SHA-256 ledger entry.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {filteredComplaints.map((item) => {
                  const isClosed = ["CLOSED_VERIFIED", "ADMIN_APPROVED"].includes(item.status);
                  const beforeImg = item.before_image || "/uploads/seed_pothole_before.jpg";
                  const afterImg = item.after_image;
                  const beforeHash = item.before_hash || "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8";
                  const afterHash = item.after_hash;

                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: "var(--bg-input)",
                        border: isClosed ? "1px solid rgba(16, 185, 129, 0.45)" : "1px solid var(--border-color)",
                        borderRadius: "var(--radius-md)",
                        padding: "1.35rem",
                        boxShadow: isClosed ? "0 4px 20px rgba(16, 185, 129, 0.08)" : "none"
                      }}
                    >
                      {/* Top Bar: Complaint Code, Category, Creation Time, Prominent Green Badge */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.85rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                          <span className="font-mono" style={{ fontSize: "0.85rem", color: "var(--amber-primary)", fontWeight: 800, letterSpacing: "0.5px" }}>
                            {item.complaint_code}
                          </span>
                          <span style={{ fontSize: "0.75rem", backgroundColor: "rgba(255, 255, 255, 0.06)", padding: "0.2rem 0.55rem", borderRadius: "4px", color: "var(--text-secondary)", fontWeight: 600 }}>
                            {item.category}
                          </span>
                          <span style={{ fontSize: "0.725rem", color: "var(--text-muted)" }}>
                            • Filed: {item.created_at ? new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recent"}
                          </span>
                        </div>

                        {/* Prominent Green CLOSED - VERIFIED FIXED Badge if Auditor Approved / Closed */}
                        <div>
                          {isClosed ? (
                            <span 
                              className="badge-obsidian badge-emerald" 
                              style={{ 
                                padding: "0.35rem 0.85rem", 
                                fontSize: "0.825rem", 
                                fontWeight: 800, 
                                display: "inline-flex", 
                                alignItems: "center", 
                                gap: "0.4rem",
                                boxShadow: "0 0 15px rgba(16, 185, 129, 0.25)" 
                              }}
                            >
                              <CheckCircle2 size={13} /> CLOSED - VERIFIED FIXED
                            </span>
                          ) : (
                            <StatusBadge status={item.status} />
                          )}
                        </div>
                      </div>

                      {/* Complaint Headline & Location */}
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.35rem", lineHeight: 1.35 }}>
                        {item.title}
                      </h3>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                        <MapPin size={14} color="var(--amber-primary)" />
                        <span>{item.location}</span>
                        <span style={{ color: "var(--accent-cyan)", fontSize: "0.725rem", fontFamily: "var(--font-mono)", marginLeft: "0.3rem" }}>
                          ({item.latitude?.toFixed(4)}° N, {item.longitude?.toFixed(4)}° E)
                        </span>
                      </div>

                      {/* 4 Completed Timeline Steps */}
                      <div style={{ backgroundColor: "var(--bg-card-hover)", borderRadius: "var(--radius-sm)", padding: "0.75rem 1rem", border: "1px solid var(--border-color)", marginBottom: "1.25rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.45rem" }}>
                          <span style={{ fontSize: "0.725rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.5px" }}>
                            Civic Resolution Lifecycle
                          </span>
                          <span style={{ fontSize: "0.725rem", color: isClosed ? "var(--accent-emerald)" : "var(--amber-light)", fontWeight: 700 }}>
                            {isClosed ? "ALL 4 STAGES VERIFIED COMPLETE" : "WORKFLOW IN PROGRESS"}
                          </span>
                        </div>

                        <div className="progression-stepper">
                          {/* Step 1: REPORTED */}
                          <div className="step-node completed">
                            <div className="step-circle"><Check size={11} /></div>
                            <span>1. REPORTED</span>
                          </div>

                          {/* Step 2: ASSIGNED */}
                          <div className={`step-node ${["ASSIGNED", "IN_PROGRESS", "REPAIR_SUBMITTED", "AI_VERIFIED_FIXED", "AI_NOT_VERIFIED", "CLOSED_VERIFIED", "ADMIN_APPROVED", "DISPUTED"].includes(item.status) ? "completed" : "active"}`}>
                            <div className="step-circle">
                              {["ASSIGNED", "IN_PROGRESS", "REPAIR_SUBMITTED", "AI_VERIFIED_FIXED", "AI_NOT_VERIFIED", "CLOSED_VERIFIED", "ADMIN_APPROVED", "DISPUTED"].includes(item.status) ? <Check size={11} /> : "2"}
                            </div>
                            <span>2. ASSIGNED</span>
                          </div>

                          {/* Step 3: AFTER UPLOAD */}
                          <div className={`step-node ${["REPAIR_SUBMITTED", "AI_VERIFIED_FIXED", "AI_NOT_VERIFIED", "CLOSED_VERIFIED", "ADMIN_APPROVED"].includes(item.status) ? "completed" : item.status === "DISPUTED" ? "active" : ""}`}>
                            <div className="step-circle">
                              {["REPAIR_SUBMITTED", "AI_VERIFIED_FIXED", "AI_NOT_VERIFIED", "CLOSED_VERIFIED", "ADMIN_APPROVED"].includes(item.status) ? <Check size={11} /> : "3"}
                            </div>
                            <span>3. AFTER UPLOAD</span>
                          </div>

                          {/* Step 4: VERIFIED FIXED (All 4 complete when approved by auditor) */}
                          <div className={`step-node ${isClosed ? "completed" : ["AI_VERIFIED_FIXED", "AI_NOT_VERIFIED", "DISPUTED"].includes(item.status) ? "active" : ""}`}>
                            <div className="step-circle">
                              {isClosed ? <Check size={11} /> : "4"}
                            </div>
                            <span>4. VERIFIED FIXED</span>
                          </div>
                        </div>
                      </div>

                      {/* Before / After Evidence Grid with SHA-256 Cryptographic Anchors */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                        
                        {/* BEFORE PHOTO CARD */}
                        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "0.85rem" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--amber-light)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              Original Defect Evidence (BEFORE)
                            </span>
                            <span className="badge-obsidian badge-amber" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}>
                              CITIZEN ANCHOR
                            </span>
                          </div>

                          <div style={{ position: "relative", height: "180px", borderRadius: "var(--radius-sm)", overflow: "hidden", backgroundColor: "#000", border: "1px solid var(--border-color)", marginBottom: "0.65rem" }}>
                            <img
                              src={beforeImg}
                              alt="Before defect"
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>

                          {/* Cryptographic SHA-256 Hash Anchor Pill */}
                          <div style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "0.5rem 0.65rem" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                <Lock size={11} color="var(--amber-primary)" /> SHA-256 Evidence Anchor
                              </span>
                              <button
                                onClick={() => handleCopyHash(beforeHash)}
                                className="btn btn-obsidian btn-sm"
                                style={{ padding: "1px 5px", fontSize: "0.65rem", gap: "0.25rem" }}
                                title="Copy full SHA-256 hash"
                              >
                                {copiedHash === beforeHash ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                                <span>{copiedHash === beforeHash ? "Copied" : "Copy"}</span>
                              </button>
                            </div>
                            <div className="font-mono" style={{ fontSize: "0.7rem", color: "var(--accent-cyan)", wordBreak: "break-all", lineHeight: 1.3 }}>
                              {beforeHash}
                            </div>
                          </div>
                        </div>

                        {/* AFTER PHOTO CARD */}
                        <div style={{ backgroundColor: "var(--bg-card)", border: isClosed ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "0.85rem" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-emerald)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              Contractor Field Evidence (AFTER)
                            </span>
                            <span className="badge-obsidian badge-emerald" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}>
                              {afterImg ? "REPAIR UPLOADED" : "AWAITING SQUAD"}
                            </span>
                          </div>

                          {afterImg ? (
                            <>
                              <div style={{ position: "relative", height: "180px", borderRadius: "var(--radius-sm)", overflow: "hidden", backgroundColor: "#000", border: "1px solid var(--border-color)", marginBottom: "0.65rem" }}>
                                <img
                                  src={afterImg}
                                  alt="After repair evidence"
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              </div>

                              {/* Cryptographic SHA-256 Hash Anchor Pill */}
                              <div style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "0.5rem 0.65rem" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                    <Lock size={11} color="var(--accent-emerald)" /> SHA-256 Repair Proof Anchor
                                  </span>
                                  <button
                                    onClick={() => handleCopyHash(afterHash || "a48c91d791b8f2d56a09c4819d4218e974e44bb21a71676646b5a3ebc6731920")}
                                    className="btn btn-obsidian btn-sm"
                                    style={{ padding: "1px 5px", fontSize: "0.65rem", gap: "0.25rem" }}
                                    title="Copy full SHA-256 hash"
                                  >
                                    {copiedHash === (afterHash || "a48c91d791b8f2d56a09c4819d4218e974e44bb21a71676646b5a3ebc6731920") ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                                    <span>{copiedHash === (afterHash || "a48c91d791b8f2d56a09c4819d4218e974e44bb21a71676646b5a3ebc6731920") ? "Copied" : "Copy"}</span>
                                  </button>
                                </div>
                                <div className="font-mono" style={{ fontSize: "0.7rem", color: "var(--accent-emerald)", wordBreak: "break-all", lineHeight: 1.3 }}>
                                  {afterHash || "a48c91d791b8f2d56a09c4819d4218e974e44bb21a71676646b5a3ebc6731920"}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div style={{ height: "235px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-input)", borderRadius: "var(--radius-sm)", border: "1px dashed var(--border-color)", padding: "1rem", textAlign: "center" }}>
                              <Clock size={32} color="var(--amber-light)" style={{ marginBottom: "0.5rem" }} />
                              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                                Field Repair in Progress
                              </div>
                              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem", maxWidth: "240px" }}>
                                Assigned to {item.fixer_name || "Squad-07 Dispatch"}. Repair photo will be hashed with SHA-256 upon field upload.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Bottom Actions */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-color)", paddingTop: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", fontSize: "0.775rem", color: "var(--text-muted)" }}>
                          <span>Contractor Squad: <strong style={{ color: "var(--amber-light)" }}>{item.fixer_name || "Squad-07 Dispatch"}</strong></span>
                          {isClosed && (
                            <span style={{ color: "var(--accent-emerald)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <ShieldCheck size={14} /> Municipal Auditor Signed & Verified
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleOpenInspect(item.id)}
                          className="btn btn-obsidian btn-sm"
                          style={{ color: "var(--amber-light)", borderColor: "rgba(245, 158, 11, 0.4)", gap: "0.4rem" }}
                        >
                          <Sliders size={13} />
                          <span>Inspect & Verify (Curtain Slider)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Integrated Cryptographic SHA-256 Municipal Audit Ledger */}
          <div className="obsidian-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <ShieldCheck size={20} color="var(--amber-primary)" />
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                    Integrated Cryptographic SHA-256 Municipal Ledger
                  </h2>
                  <span className="badge-obsidian badge-amber">IMMUTABLE AUDIT CHAIN</span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                  Verifiable audit log of citizen defect submissions, contractor repairs, AI multimodal verdicts, and municipal auditor overrides.
                </p>
              </div>

              {/* Action Filter Pills */}
              <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                {[
                  { label: "All Events", value: "" },
                  { label: "Complaints", value: "COMPLAINT" },
                  { label: "Contractor Uploads", value: "REPAIR" },
                  { label: "AI Verifications", value: "AI" },
                  { label: "Citizen Actions", value: "REPORTER" },
                  { label: "Auditor Overrides", value: "ADMIN" }
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setAuditFilterAction(tab.value)}
                    className={`btn btn-sm ${auditFilterAction === tab.value ? "btn-amber" : "btn-obsidian"}`}
                    style={{ fontSize: "0.725rem", padding: "0.25rem 0.65rem" }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {auditLoading ? (
              <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--text-muted)" }}>
                Loading immutable audit ledger...
              </div>
            ) : filteredAuditLogs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)" }}>
                <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 600 }}>No civic defects reported yet.</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                  Submit a report to generate a SHA-256 ledger entry.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {filteredAuditLogs.map((log) => {
                  const isCitizenAction = (log.actor_role === "citizen") || (log.action || "").includes("REPORTER") || (log.action || "").includes("FILED");
                  const isAdminAction = (log.actor_role === "admin") || (log.action || "").includes("ADMIN");
                  const isContractorAction = (log.actor_role === "fixer") || (log.action || "").includes("REPAIR");
                  const isAiAction = (log.action || "").includes("AI");

                  let badgeColor = "var(--amber-primary)";
                  let badgeBg = "rgba(245, 158, 11, 0.1)";
                  if (isAdminAction) {
                    badgeColor = "var(--accent-purple)";
                    badgeBg = "rgba(168, 85, 247, 0.1)";
                  } else if (isCitizenAction) {
                    badgeColor = "var(--accent-cyan)";
                    badgeBg = "rgba(56, 189, 248, 0.1)";
                  } else if (isAiAction) {
                    badgeColor = "var(--accent-emerald)";
                    badgeBg = "rgba(16, 185, 129, 0.1)";
                  }

                  return (
                    <div
                      key={log.id}
                      style={{
                        backgroundColor: "var(--bg-input)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "var(--radius-sm)",
                        padding: "0.85rem 1rem",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "0.75rem"
                      }}
                    >
                      <div style={{ flex: 1, minWidth: "260px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              color: badgeColor,
                              backgroundColor: badgeBg,
                              border: `1px solid ${badgeColor}40`,
                              padding: "0.15rem 0.5rem",
                              borderRadius: "3px"
                            }}
                          >
                            {log.action}
                          </span>
                          <span style={{ fontSize: "0.775rem", fontWeight: 700, color: "var(--text-primary)" }}>
                            {log.actor_name}
                          </span>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            ({log.actor_role})
                          </span>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            • {log.timestamp}
                          </span>
                        </div>

                        <div style={{ fontSize: "0.825rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                          {log.details}
                        </div>
                      </div>

                      {/* Cryptographic SHA-256 Hash pill */}
                      {log.evidence_hash && (
                        <div style={{ alignSelf: "center" }}>
                          <SecurityBadge hash={log.evidence_hash} label="Record Hash" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 
        ===================================================================
        Inspect & Verify Modal (Accessible from both tabs)
        ===================================================================
      */}
      {detailModalOpen && selectedComplaint && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(3, 7, 18, 0.88)",
          backdropFilter: "blur(12px)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem"
        }}>
          <div className="obsidian-card" style={{
            maxWidth: "920px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            border: "1px solid var(--border-amber)",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.2)"
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="font-mono" style={{ fontSize: "0.85rem", color: "var(--amber-primary)", fontWeight: 700 }}>
                    {selectedComplaint.complaint_code}
                  </span>
                  {["CLOSED_VERIFIED", "ADMIN_APPROVED"].includes(selectedComplaint.status) ? (
                    <span className="badge-obsidian badge-emerald" style={{ fontWeight: 800 }}>
                      <CheckCircle2 size={11} /> CLOSED - VERIFIED FIXED
                    </span>
                  ) : (
                    <StatusBadge status={selectedComplaint.status} />
                  )}
                </div>
                <h2 style={{ fontSize: "1.35rem", color: "var(--text-primary)", marginTop: "0.25rem" }}>
                  {selectedComplaint.title}
                </h2>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {selectedComplaint.location}
                </div>
              </div>

              <button
                onClick={() => setDetailModalOpen(false)}
                className="btn btn-obsidian btn-sm"
              >
                <X size={16} />
              </button>
            </div>

            {/* Interactive Draggable Curtain Slider / Side-by-Side Comparison */}
            <div style={{ marginBottom: "1.25rem" }}>
              <CurtainSlider
                beforeImg={selectedComplaint.evidence_list?.find(e => e.evidence_type === "BEFORE")?.file_path || selectedComplaint.before_image || "/uploads/seed_pothole_before.jpg"}
                afterImg={selectedComplaint.evidence_list?.find(e => e.evidence_type === "AFTER")?.file_path || selectedComplaint.after_image || null}
                beforeHash={selectedComplaint.evidence_list?.find(e => e.evidence_type === "BEFORE")?.sha256_hash}
                afterHash={selectedComplaint.evidence_list?.find(e => e.evidence_type === "AFTER")?.sha256_hash}
                height="320px"
              />
            </div>

            {/* AI Verification Results Box */}
            {selectedComplaint.verification && (
              <div style={{ backgroundColor: "rgba(245, 158, 11, 0.05)", border: "1px solid var(--border-amber)", borderRadius: "var(--radius-md)", padding: "1.25rem", marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Sparkles size={18} color="var(--amber-primary)" />
                    <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>
                      Multimodal AI Verdict: {selectedComplaint.verification.verdict}
                    </span>
                  </div>
                  <span className="badge-obsidian badge-amber">
                    Confidence: {selectedComplaint.verification.confidence_score}%
                  </span>
                </div>

                <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", lineHeight: 1.5, marginBottom: "0.85rem" }}>
                  {selectedComplaint.verification.explanation}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem", fontSize: "0.775rem" }}>
                  <div style={{ backgroundColor: "var(--bg-input)", padding: "0.5rem", borderRadius: "4px" }}>
                    Location Matched: <strong style={{ color: selectedComplaint.verification.location_match ? "var(--accent-emerald)" : "var(--accent-rose)" }}>{selectedComplaint.verification.location_match ? "YES" : "NO"}</strong>
                  </div>
                  <div style={{ backgroundColor: "var(--bg-input)", padding: "0.5rem", borderRadius: "4px" }}>
                    Landmarks Aligned: <strong style={{ color: selectedComplaint.verification.landmarks_match ? "var(--accent-emerald)" : "var(--accent-rose)" }}>{selectedComplaint.verification.landmarks_match ? "YES" : "NO"}</strong>
                  </div>
                  <div style={{ backgroundColor: "var(--bg-input)", padding: "0.5rem", borderRadius: "4px" }}>
                    Defect Still Visible: <strong style={{ color: selectedComplaint.verification.problem_still_visible ? "var(--accent-rose)" : "var(--accent-emerald)" }}>{selectedComplaint.verification.problem_still_visible ? "YES" : "NO"}</strong>
                  </div>
                  <div style={{ backgroundColor: "var(--bg-input)", padding: "0.5rem", borderRadius: "4px" }}>
                    Repair Complete: <strong style={{ color: selectedComplaint.verification.repair_complete ? "var(--accent-emerald)" : "var(--accent-rose)" }}>{selectedComplaint.verification.repair_complete ? "YES" : "NO"}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Citizen Approval Gate Section */}
            {!selectedComplaint.reporter_decision && !["CLOSED_VERIFIED", "ADMIN_APPROVED"].includes(selectedComplaint.status) && (
              <div style={{ backgroundColor: "var(--bg-card-hover)", border: "1px solid rgba(245, 158, 11, 0.4)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
                <h4 style={{ fontSize: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                  <FileCheck size={18} color="var(--amber-primary)" />
                  Citizen Approval Gate Decision
                </h4>
                <p style={{ fontSize: "0.825rem", color: "var(--text-secondary)", marginBottom: "0.85rem" }}>
                  Only you (the resident reporter) can officially close this civic defect. If you dispute, it escalates to the Municipal Auditor.
                </p>

                <div style={{ marginBottom: "0.85rem" }}>
                  <input
                    type="text"
                    placeholder="Add your comments / physical inspection notes (optional)..."
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    onClick={() => handleReporterAction("AGREED_FIXED")}
                    disabled={actionLoading}
                    className="btn btn-emerald"
                    style={{ flex: 1 }}
                  >
                    <Check size={16} />
                    <span>Approve & Close Defect</span>
                  </button>

                  <button
                    onClick={() => handleReporterAction("DISAGREED_STILL_EXISTS")}
                    disabled={actionLoading}
                    className="btn btn-rose"
                    style={{ flex: 1 }}
                  >
                    <X size={16} />
                    <span>Dispute & Escalate to Auditor</span>
                  </button>
                </div>
              </div>
            )}

            {selectedComplaint.reporter_decision && (
              <div style={{ backgroundColor: "var(--bg-card-hover)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "1rem", marginTop: "1rem" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: selectedComplaint.reporter_decision.decision === "AGREED_FIXED" ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                  Citizen Decision: {selectedComplaint.reporter_decision.decision === "AGREED_FIXED" ? "Approved Resolution" : "Disputed Repair"}
                </div>
                {selectedComplaint.reporter_decision.feedback_comments && (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                    "{selectedComplaint.reporter_decision.feedback_comments}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
