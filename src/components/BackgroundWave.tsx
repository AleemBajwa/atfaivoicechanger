"use client";
import React, { useRef, useEffect } from 'react';

const BAR_COLORS = [
  "#6fffd6", // mint
  "#fffbe6", // off-white
  "#ffe066", // yellow
  "#ffd6e0", // pink
  "#b5aaff", // purple
  "#aee9ff", // blue
  "#ffb347", // orange
  "#f7b7a3", // peach
  "#c3f584", // light green
  "#fff",    // white
  "#ff5e62", // coral
  "#5ee7df", // teal
  "#b490ca", // lavender
  "#f9ea8f", // light yellow
  "#f6d365", // gold
  "#fd6e6a", // red
];
const NUM_BARS = 96;

export default function BackgroundWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Assign each bar a random color from the palette (stable across renders)
  const barColorsRef = useRef<string[]>([]);
  if (barColorsRef.current.length !== NUM_BARS) {
    barColorsRef.current = Array.from({ length: NUM_BARS }, () =>
      BAR_COLORS[Math.floor(Math.random() * BAR_COLORS.length)]
    );
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    const height = 240;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    function drawGrid() {
      if (!ctx) return;
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = '#fff';
      for (let x = 0; x < width; x += 24) {
        for (let y = 0; y < height; y += 24) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#11131a';
      ctx.fillRect(0, 0, width, height);
      drawGrid();
      const barWidth = Math.max(1, Math.floor(width / (NUM_BARS * 1.5)));
      const gap = (width - NUM_BARS * barWidth) / (NUM_BARS + 1);
      const now = Date.now();
      for (let i = 0; i < NUM_BARS; i++) {
        // Smooth flowing animation using sine waves
        const phase = (i / NUM_BARS) * Math.PI * 2;
        const t = now / 900 + phase * 1.2;
        const amplitude = height * 0.38 + Math.sin(t) * height * 0.22;
        const barHeight = Math.max(12, amplitude + Math.sin(t * 1.7 + i) * 18);
        const x = gap + i * (barWidth + gap);
        const y = height - barHeight;
        ctx.save();
        ctx.fillStyle = barColorsRef.current[i];
        ctx.globalAlpha = 0.92;
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.restore();
      }
      requestAnimationFrame(draw);
    }
    draw();
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '240px',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 1,
        transition: 'opacity 0.3s',
      }}
      aria-hidden="true"
    />
  );
} 