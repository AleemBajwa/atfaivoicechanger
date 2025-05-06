import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TopBar } from "../components/TopBar";
import BackgroundWave from "../components/BackgroundWave";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Voice Changer",
  description: "Transform your voice with AI technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}> 
      <body className="relative min-h-screen bg-white dark:bg-black">
        <BackgroundWave />
        <TopBar />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
