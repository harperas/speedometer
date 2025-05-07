"use client";

import { useState } from "react";
import ReactSpeedometer from "react-d3-speedometer";

const TestSpeedometer = () => {
  const [speed, setSpeed] = useState(0);

  const handleSpeed = (incVal) => {
    setSpeed((val) => val + incVal);
  };
  return (
    <div>
      <ReactSpeedometer
        maxValue={480}
        value={speed}
        needleColor="steelblue"
        startColor="green"
        endColor="red"
        segments={10}
        height={200}
        needleTransition="easeQuadInOut"
        needleTransitionDuration={500}
        currentValueText="Speed: ${value} km/h"
      />

      <div>
        <button
          onClick={() => handleSpeed(1)}
          className=" p-4 bg-cyan-400 hover:bg-cyan-600 text-black"
        >
          Increase
        </button>
        <button
          onClick={() => handleSpeed(10)}
          className=" p-4 bg-cyan-400 hover:bg-cyan-600 text-black"
        >
          Increase 10+
        </button>
        <button
          onClick={() => handleSpeed(-1)}
          className=" p-4 bg-red-200 hover:bg-red-400 text-black"
        >
          Decrease
        </button>
        <button
          onClick={() => handleSpeed(-10)}
          className=" p-4 bg-red-200 hover:bg-red-400 text-black"
        >
          Decrease 10-
        </button>
      </div>
    </div>
  );
};

export default TestSpeedometer;
