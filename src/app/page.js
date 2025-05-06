"use client";

import GeoSpeedometer from "./components/GeoSpeedometer";
// // import GeoSpeedometerWithMap from "./components/GeoSpeedometerWithMap";
// import dynamic from "next/dynamic";

// const GeoSpeedometerWithMap = dynamic(
//   () => import("./components/GeoSpeedometerWithMap"),
//   { ssr: false }
// );

export default function Home() {
  return (
    <main className=" bg-gray-100  ">
      <GeoSpeedometer />
      {/* <GeoSpeedometerWithMap /> */}
    </main>
  );
}
