import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { Navigation, RotateCcw } from "lucide-react";

export const RaipurMap = ({
  complaints = [],
  selectedComplaintId = null,
  onSelectComplaint = () => {},
  height = "420px"
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const markerSignaturesRef = useRef({});

  const RAIPUR_CENTER = [21.2514, 81.6296];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: RAIPUR_CENTER,
        zoom: 13,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    const activeIds = new Set(complaints.map((c) => String(c.id)));

    // 1. Remove markers that are no longer in complaints list
    Object.keys(markersRef.current).forEach((id) => {
      if (!activeIds.has(String(id))) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
        delete markerSignaturesRef.current[id];
      }
    });

    // 2. Add or update markers selectively without wiping DOM nodes
    complaints.forEach((c) => {
      const lat = c.latitude || 21.2514;
      const lng = c.longitude || 81.6296;

      const isApprovedFixed = c.status === "CLOSED_VERIFIED" || c.status === "ADMIN_APPROVED";
      const pinColor = isApprovedFixed ? "#10b981" : "#ef4444";
      const signature = `${lat}_${lng}_${c.status}_${c.title}_${c.location}`;

      const existingMarker = markersRef.current[c.id];
      if (existingMarker && markerSignaturesRef.current[c.id] === signature) {
        // Unchanged - preserve existing marker and prevent map flickering
        return;
      }

      if (existingMarker) {
        existingMarker.remove();
      }

      const customIcon = L.divIcon({
        className: "custom-div-icon",
        html: `
          <div class="custom-map-pin" style="background-color: ${pinColor}; box-shadow: 0 0 14px ${pinColor}; border: 2px solid #fff;">
            <span class="custom-map-pin-inner" style="font-size: 10px;">${isApprovedFixed ? '✔' : '●'}</span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
      });

      const popupContent = `
        <div style="padding: 6px; font-family: system-ui; max-width: 240px;">
          <div style="font-size: 11px; font-weight: 800; color: #f59e0b; font-family: monospace;">
            ${c.complaint_code} · ${c.category}
          </div>
          <div style="font-size: 13px; font-weight: 700; margin: 4px 0 6px; line-height: 1.2;">
            ${c.title}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
            📍 ${c.location}
          </div>
          <div style="font-size: 10px; font-family: monospace; color: #38bdf8; margin-bottom: 6px;">
            GPS: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #334155; padding-top: 6px;">
            <span style="font-size: 10px; font-weight: 800; color: ${pinColor}; text-transform: uppercase;">
              ${c.status}
            </span>
            <span style="font-size: 10px; text-decoration: underline; color: #f59e0b; cursor: pointer; font-weight: 700;">
              Inspect ➔
            </span>
          </div>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupContent);

      marker.on("click", () => {
        onSelectComplaint(c.id);
      });

      markersRef.current[c.id] = marker;
      markerSignaturesRef.current[c.id] = signature;
    });

    return () => {
      // clean up on unmount handled in parent if needed
    };
  }, [complaints, onSelectComplaint]);

  // Handle selected complaint zoom / fly
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedComplaintId) return;
    const target = complaints.find((c) => c.id === selectedComplaintId);
    if (target && target.latitude && target.longitude) {
      mapInstanceRef.current.flyTo([target.latitude, target.longitude], 15, {
        duration: 1.2
      });
      const marker = markersRef.current[selectedComplaintId];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedComplaintId, complaints]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(RAIPUR_CENTER, 13, { duration: 1 });
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height, borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border-color)" }}>
      {/* Top Map Legend & Recenter Bar */}
      <div style={{
        position: "absolute",
        top: "0.75rem",
        right: "0.75rem",
        zIndex: 500,
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-sm)",
        padding: "0.4rem 0.85rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        fontSize: "0.75rem"
      }}>
        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", fontWeight: 700 }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#ef4444", boxShadow: "0 0 8px #ef4444" }} />
            <span style={{ color: "var(--accent-rose)" }}>Active / Unverified Defect</span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#10b981", boxShadow: "0 0 8px #10b981" }} />
            <span style={{ color: "var(--accent-emerald)" }}>Auditor Approved & Verified</span>
          </span>
        </div>

        {/* Recenter Button */}
        <button
          onClick={handleRecenter}
          className="btn btn-obsidian btn-sm"
          style={{ padding: "0.2rem 0.5rem", fontSize: "0.725rem", gap: "0.25rem", color: "var(--amber-primary)" }}
          title="Recenter map to Raipur center"
        >
          <RotateCcw size={12} />
          <span>Recenter Raipur</span>
        </button>
      </div>

      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};
