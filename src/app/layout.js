import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Live Speedometer",
  description: "Track your real-time driving speed with GPS",
  icons: {
    icon: "/favicons/android-launchericon-192-192.png",
    apple: "/favicons/android-launchericon-192-192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
  },
  other: {
    "mobile-web-app-capable": "yes", // extra meta tag
  },
};

export const viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
