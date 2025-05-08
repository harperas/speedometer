"use client";
import React, { useEffect, useState, useRef } from "react";
import ReactSpeedometer from "react-d3-speedometer";

const GeoSpeedometer = () => {
  const [speed, setSpeed] = useState(0);
  const [error, setError] = useState(null);

  const [totalDistance, setTotalDistance] = useState(0);
  const [maxSpeed, setMaxSpeed] = useState(0);
  const [averageSpeed, setAverageSpeed] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [duration, setDuration] = useState(0);

  const intervalRef = useRef(null);
  const positions = useRef([]);
  const wakeLockRef = useRef(null);
  const audioRef = useRef(null);
  const lastPositionRef = useRef(null);

  //getting previous total distance from local storage
  useEffect(() => {
    const storedDistance = localStorage.getItem("totalDistance");
    storedDistance
      ? setTotalDistance(parseFloat(storedDistance))
      : setTotalDistance(0);

    const storedMaxSpeed = localStorage.getItem("maxspeed");
    storedMaxSpeed ? setMaxSpeed(parseInt(storedMaxSpeed)) : setMaxSpeed(0);

    const storedAverageSpeed = localStorage.getItem("averagespeed");
    storedAverageSpeed
      ? setAverageSpeed(parseInt(storedAverageSpeed))
      : setAverageSpeed(0);
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

      if (!startTime) setStartTime(new Date(timestamp));
      setEndTime(new Date(timestamp));

      if (lastPositionRef.current) {
        const prev = lastPositionRef.current;
        const distance = getDistance(prev.lat, prev.lng, latitude, longitude);
        const timeDiff = (timestamp - prev.timestamp) / 1000;

        if (timeDiff > 0 && distance < 1000) {
          const currentSpeed = (distance / timeDiff) * 3.6; // m/s to km/h
          if (!isNaN(currentSpeed) && currentSpeed < 300) {
            setSpeed(Math.round(currentSpeed));

            if (currentSpeed > maxSpeed) {
              setMaxSpeed(Math.round(currentSpeed));
              localStorage.setItem("maxspeed", currentSpeed);
            }
            positions.current.push({ speed: currentSpeed, time: timestamp });
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
  }, [totalDistance, maxSpeed, startTime]);

  // Duration + Avg Speed
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (startTime && endTime) {
        const diff = (endTime - startTime) / 1000;
        setDuration(diff);

        const speeds = positions.current.map((p) => p.speed);
        const avg = speeds.reduce((a, b) => a + b, 0) / (speeds.length || 1);
        setAverageSpeed(Math.round(avg));
        localStorage.setItem("averagespeed", avg);
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [startTime, endTime]);

  // Distance Calculation
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

  // Reset Button
  const handleReset = () => {
    setSpeed(0);
    setTotalDistance(0);
    setMaxSpeed(0);
    setAverageSpeed(0);
    setStartTime(null);
    setEndTime(null);
    setDuration(0);
    positions.current = [];
    lastPositionRef.current = null;
  };

  return (
    <div
      className={` h-screen flex flex-col justify-center items-center ${
        speed < 10
          ? "bg-gray-100"
          : speed < 40
          ? "bg-green-300"
          : speed < 65
          ? "bg-yellow-100 "
          : "bg-rose-400 text-white "
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

      <div style={{ marginTop: "1rem", textAlign: "left" }}>
        <h3>
          <strong>🕒 Start Time:</strong>{" "}
          {startTime ? startTime.toLocaleTimeString() : "—"}
        </h3>
        <h3>
          <strong>🏁 End Time:</strong>{" "}
          {endTime ? endTime.toLocaleTimeString() : "—"}
        </h3>
        <h3>
          <strong>⏳ Duration:</strong>{" "}
          {duration ? Math.floor(duration) + " sec" : "—"}
        </h3>
        <h3>
          <strong>📈 Avg Speed:</strong> {averageSpeed} km/h
        </h3>
        <h3>
          <strong>🚀 Max Speed:</strong> {maxSpeed} km/h
        </h3>
        <h3>
          <strong>📍 Total Distance:</strong> {totalDistance.toFixed(2)} km
        </h3>
      </div>

      <button
        onClick={handleReset}
        className=" bg-black px-11 py-2.5 rounded-2xl shadow-2xl mt-7 text-white leading-relaxed font-semibold cursor-pointer "
      >
        🔄 Reset Trip
      </button>

      {error && <p className=" text-red-500 ">{error}</p>}
    </div>
  );
};

export default GeoSpeedometer;
