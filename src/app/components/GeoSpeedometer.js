"use client";
import React, { useEffect, useState, useRef } from "react";
import ReactSpeedometer from "react-d3-speedometer";

const GeoSpeedometer = () => {
  const [speed, setSpeed] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [error, setError] = useState(null);

  const wakeLockRef = useRef(null);
  const audioRef = useRef(null);
  const lastPositionRef = useRef(null);

  //getting previous total distance from local storage
  useEffect(() => {
    const stored = localStorage.getItem("totalDistance");
    stored ? setTotalDistance(parseFloat(stored)) : setTotalDistance(0);
  }, []);

  // === 🛡️ Wake Lock Setup ===
  // useEffect(() => {
  //   const requestWakeLock = async () => {
  //     try {
  //       if ("wakeLock" in navigator) {
  //         wakeLockRef.current = await navigator.wakeLock.request("screen");
  //         console.log("Wake Lock is active");
  //       }
  //     } catch (err) {
  //       console.error("Failed to get wake lock:", err);
  //     }
  //   };

  //   requestWakeLock();

  //   // Re-activate wake lock on visibility change
  //   const handleVisibilityChange = () => {
  //     if (document.visibilityState === "visible") {
  //       requestWakeLock();
  //     }
  //   };

  //   document.addEventListener("visibilitychange", handleVisibilityChange);

  //   return () => {
  //     document.removeEventListener("visibilitychange", handleVisibilityChange);
  //     if (wakeLockRef.current) {
  //       wakeLockRef.current.release().then(() => {
  //         console.log("Wake Lock released");
  //       });
  //     }
  //   };
  // }, []);

  // === 🛡️ Wake Lock Setup with audio for both android and ios ===
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
          console.log("Wake Lock is active (native)");
        } else {
          // Fallback for iOS
          console.log("Wake Lock not supported, using audio fallback");
          playSilentAudio();
        }
      } catch (err) {
        console.error("Wake Lock error:", err);
      }
    };

    const playSilentAudio = () => {
      if (!audioRef.current) {
        const audio = new Audio("/silent-audio.mp3");
        audio.loop = true;
        audio.volume = 0;
        audioRef.current = audio;
      }
      audioRef.current
        .play()
        .catch((err) => console.warn("Audio autoplay failed:", err));
    };

    requestWakeLock();

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    });

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          console.log("Wake Lock released");
        });
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // === 📡 GPS Speed Tracking ===
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

          if (!isNaN(distance) && distance < 1000) {
            const newTotal = totalDistance + distance / 1000;
            setTotalDistance(newTotal);
            localStorage.setItem("totalDistance", newTotal.toFixed(3));
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
  }, [totalDistance]);

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
    <div
      className={` h-screen flex flex-col justify-center items-center ${
        speed < 10
          ? "bg-gray-100"
          : speed < 40
          ? "bg-green-300"
          : speed < 65
          ? "bg-yellow-100"
          : "bg-rose-300"
      } `}
    >
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
      <h3 className=" mt-5 ">
        🚗 Total Distance: {totalDistance.toFixed(2)} km
      </h3>
      <button
        onClick={() => {
          setTotalDistance(0);
        }}
        className=" bg-black px-11 py-2.5 rounded-2xl shadow-2xl mt-7 text-white leading-relaxed font-semibold cursor-pointer "
      >
        Reset Distance
      </button>
      {error && <p className=" text-red-500 ">{error}</p>}
    </div>
  );
};

export default GeoSpeedometer;
