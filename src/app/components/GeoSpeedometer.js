"use client";
import React, { useEffect, useState, useRef } from "react";
import ReactSpeedometer from "react-d3-speedometer";

const GeoSpeedometer = () => {
  const [speed, setSpeed] = useState(0);
  const [error, setError] = useState(null);
  const lastPositionRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported");
      return;
    }

    let watchId;

    const updateSpeed = (position) => {
      const { latitude, longitude } = position.coords;
      const timestamp = position.timestamp;

      const currentPos = { lat: latitude, lng: longitude, timestamp };

      if (lastPositionRef.current) {
        const prev = lastPositionRef.current;
        const distance = getDistance(prev.lat, prev.lng, latitude, longitude);
        const timeDiff = (timestamp - prev.timestamp) / 1000;

        if (timeDiff > 0) {
          const currentSpeed = (distance / timeDiff) * 3.6; // m/s to km/h
          if (!isNaN(currentSpeed) && currentSpeed < 300) {
            setSpeed(Math.round(currentSpeed));
          }
        }
      }

      lastPositionRef.current = currentPos;
    };

    watchId = navigator.geolocation.watchPosition(
      updateSpeed,
      (err) => {
        console.log("Geo error:", err);
        setError("Failed to get location");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  function getDistance(lat1, lon1, lat2, lon2) {
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

  return (
    <div className=" h-screen flex flex-col justify-center items-center ">
      <h2 className=" mb-11 font-bold text-3xl ">Live GPS Speedometer</h2>
      <ReactSpeedometer
        maxValue={120}
        value={speed}
        needleColor="steelblue"
        startColor="green"
        endColor="red"
        segments={10}
        height={200}
        currentValueText="Speed: ${value} km/h"
      />
      <p>{`Speed: ${speed} km/h`}</p>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default GeoSpeedometer;
