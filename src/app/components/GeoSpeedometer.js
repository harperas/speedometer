"use client"; // for Next.js App Router, ignore if using pages/

import React, { useEffect, useState } from "react";
import ReactSpeedometer from "react-d3-speedometer";

const GeoSpeedometer = () => {
  const [speed, setSpeed] = useState(0);
  const [lastPosition, setLastPosition] = useState(null);
  const [lastTimestamp, setLastTimestamp] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const timestamp = position.timestamp;

        if (lastPosition) {
          const distance = getDistanceFromLatLonInMeters(
            lastPosition.latitude,
            lastPosition.longitude,
            latitude,
            longitude
          );
          const timeDiff = (timestamp - lastTimestamp) / 1000; // in seconds
          const calculatedSpeed =
            timeDiff > 0 ? (distance / timeDiff) * 3.6 : 0; // m/s to km/h
          setSpeed(Math.round(calculatedSpeed));
        }

        setLastPosition({ latitude, longitude });
        setLastTimestamp(timestamp);
      },
      (error) => {
        console.error("Error getting location", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [lastPosition, lastTimestamp]);

  // Haversine Formula to calculate distance in meters
  function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
  }

  return (
    <div className=" w-full h-screen  flex flex-col justify-center items-center ">
      <h2 className=" text-3xl md:text-4xl font-bold mb-16 ">
        Live Speedometer
      </h2>
      <ReactSpeedometer
        maxValue={120}
        value={speed}
        needleColor="blue"
        startColor="green"
        segments={10}
        endColor="red"
        height={250}
        currentValueText="Speed: ${value} km/h"
      />
    </div>
  );
};

export default GeoSpeedometer;
