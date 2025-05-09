"use client";
import React, { useRef, useEffect } from 'react';

const PILL_COLORS = [
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
];
const NUM_BARS = 32;
const PILLS_PER_BAR = 12;

export default function BackgroundWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    const height = 240; // Height of the visualizer area
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    function drawGrid() {
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
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#11131a';
      ctx.fillRect(0, 0, width, height);
      drawGrid();
      const barWidth = width / NUM_BARS;
      const pillHeight = height / (PILLS_PER_BAR + 2);
      for (let i = 0; i < NUM_BARS; i++) {
        // Animate: random number of active pills per bar
        const activePills = Math.floor(
          (Math.sin(Date.now() / 500 + i) + 1) / 2 * (PILLS_PER_BAR - 2)
        ) + 2 + Math.floor(Math.random() * 2);
        for (let j = 0; j < PILLS_PER_BAR; j++) {
          const isActive = j < activePills;
          ctx.save();
          ctx.globalAlpha = isActive ? 1 : 0.18;
          ctx.fillStyle = isActive
            ? PILL_COLORS[(i * 3 + j * 7 + Math.floor(Date.now() / 200)) % PILL_COLORS.length]
            : '#fff';
          const x = i * barWidth + barWidth * 0.18;
          const y = height - (j + 1) * pillHeight - 6;
          const pillW = barWidth * 0.64;
          const pillH = pillHeight * 0.7;
          const radius = pillH / 2;
          // Draw rounded pill
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + pillW - radius, y);
          ctx.arc(x + pillW - radius, y + radius, radius, -Math.PI / 2, Math.PI / 2);
          ctx.lineTo(x + radius, y + pillH);
          ctx.arc(x + radius, y + radius, radius, Math.PI / 2, (3 * Math.PI) / 2);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
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