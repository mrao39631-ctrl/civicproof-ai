import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { Navigation, MapPin } from "lucide-react";

export const PinDropMap = ({
  latitude = 21.2514,
  longitude = 81.6296,
  onLocationChange = () => {},
  height = "190px"
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(map);

      // On Click drop/move pin
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        onLocationChange(lat, lng);
      });

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Create custom pin icon
    const customIcon = L.divIcon({
      className: "custom-div-icon",
      html: `
        <div class="custom-map-pin" style="background-color: #f59e0b; box-shadow: 0 0 14px rgba(245, 158, 11, 0.7);">
          <span class="custom-map-pin-inner">★</span>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    } else {
      markerRef.current = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
    }

    map.panTo([latitude, longitude], { animate: true });

  }, [latitude, longitude, onLocationChange]);

  return (
    <div style={{ position: "relative", width: "100%", height, borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border-amber)" }}>
      {/* Top Overlay Badge */}
      <div style={{
        position: "absolute",
        top: "0.5rem",
        left: "0.5rem",
        zIndex: 500,
        backgroundColor: "rgba(11, 15, 23, 0.88)",
        backdropFilter: "blur(6px)",
        border: "1px solid var(--border-color)",
        borderRadius: "4px",
        padding: "0.25rem 0.6rem",
        fontSize: "0.725rem",
        color: "var(--amber-primary)",
        display: "flex",
        alignItems: "center",
        gap: "0.35rem",
        fontFamily: "var(--font-mono)",
        fontWeight: 700
      }}>
        <MapPin size={12} />
        <span>PIN: {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E (Click map to move)</span>
      </div>

      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};
