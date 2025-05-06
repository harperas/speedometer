"use client";

import React, { useEffect, useState } from "react";
import ReactSpeedometer from "react-d3-speedometer";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  useMap,
} from "react-leaflet";
import L from "leaflet";

// Default marker fix (Leaflet bug in Next.js)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const GeoSpeedometerWithMap = () => {
  const [speed, setSpeed] = useState(0);
  const [positionHistory, setPositionHistory] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [lastTimestamp, setLastTimestamp] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const timestamp = position.timestamp;

        const newPos = { lat: latitude, lng: longitude };
        setCurrentPosition(newPos);
        setPositionHistory((prev) => [...prev, newPos]);

        if (positionHistory.length > 0 && lastTimestamp) {
          const last = positionHistory[positionHistory.length - 1];
          const distance = getDistanceFromLatLonInMeters(
            last.lat,
            last.lng,
            latitude,
            longitude
          );
          const timeDiff = (timestamp - lastTimestamp) / 1000;
          const calculatedSpeed =
            timeDiff > 0 ? (distance / timeDiff) * 3.6 : 0;
          setSpeed(Math.round(calculatedSpeed));
        }

        setLastTimestamp(timestamp);
      },
      (error) => {
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [positionHistory, lastTimestamp]);

  // Distance function
  function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function RecenterMap({ center }) {
    const map = useMap();
    useEffect(() => {
      if (center) {
        map.setView(center);
      }
    }, [center]);
    return null;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2 style={{ textAlign: "center" }}>Live Driving Speedometer with Map</h2>
      <ReactSpeedometer
        maxValue={120}
        value={speed}
        needleColor="blue"
        startColor="green"
        endColor="red"
        segments={10}
        height={200}
        currentValueText="Speed: ${value} km/h"
      />
      {currentPosition && (
        <MapContainer
          center={currentPosition}
          zoom={15}
          scrollWheelZoom
          style={{ height: "400px", marginTop: "20px" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap center={currentPosition} />
          <Marker position={currentPosition} />
          <Polyline positions={positionHistory} color="blue" />
        </MapContainer>
      )}
    </div>
  );
};

export default GeoSpeedometerWithMap;
