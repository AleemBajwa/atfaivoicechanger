"use client";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}> 
      <body style={{ background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'var(--font-family)' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
          <HistoryModalContext.Provider value={{ open: historyModalOpen, setOpen: setHistoryModalOpen }}>
            <BackgroundWave />
            <TopBar />
            <div className="relative z-10">
        {children}
            </div>
          </HistoryModalContext.Provider>
        </div>
      </body>
    </html>
  );
}
