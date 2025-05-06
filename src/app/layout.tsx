import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopBar } from "../components/TopBar";
import BackgroundWave from "../components/BackgroundWave";
import { useState } from "react";
import { HistoryModalContext } from "../context/HistoryModalContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AlChemist Voice Changer",
  description: "Transform your voice with AI alchemy and stunning visuals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}> 
      <body className="relative min-h-screen bg-gradient-to-br from-[#2d0036] via-[#6a1bc2] to-[#fc5c7d] text-white font-sans">
        <HistoryModalContext.Provider value={{ open: historyModalOpen, setOpen: setHistoryModalOpen }}>
          <BackgroundWave />
          <TopBar />
          <div className="relative z-10">
            {children}
          </div>
        </HistoryModalContext.Provider>
      </body>
    </html>
  );
}
