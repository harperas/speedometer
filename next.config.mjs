import nextPwa from "next-pwa";

/** @type {import('next').NextConfig} */

const withPWA = nextPwa({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {};

// export default nextConfig;

export default withPWA(nextConfig);
