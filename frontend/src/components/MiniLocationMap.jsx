import React, { useEffect, useRef } from "react";
import L from "leaflet";

export const MiniLocationMap = ({
  latitude = 21.2514,
  longitude = 81.6296,
  height = "110px"
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 14,
      zoomControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: false
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(map);

    const customIcon = L.divIcon({
      className: "custom-div-icon",
      html: `
        <div class="custom-map-pin" style="width: 22px; height: 22px; background-color: #f59e0b; box-shadow: 0 0 10px rgba(245, 158, 11, 0.8);">
          <span class="custom-map-pin-inner" style="font-size: 8px;">●</span>
        </div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 22]
    });

    L.marker([latitude, longitude], { icon: customIcon }).addTo(map);

    return () => {
      map.remove();
    };
  }, [latitude, longitude]);

  return (
    <div style={{ position: "relative", width: "100%", height, borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--border-color)" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};
