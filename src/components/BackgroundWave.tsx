"use client";
import React, { useRef, useEffect } from 'react';

const NUM_BARS = 120;
const GRADIENT_COLORS = [
  { stop: 0, color: "#00c3ff" }, // blue
  { stop: 0.25, color: "#7f5fff" }, // purple
  { stop: 0.5, color: "#ff4ecd" }, // pink
  { stop: 0.75, color: "#ffb347" }, // orange
  { stop: 1, color: "#ffe066" }, // yellow
];

export default function BackgroundWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rippleRef = useRef<{x: number, t: number} | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    const height = 220;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    // Mouse ripple effect
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      rippleRef.current = { x, t: Date.now() };
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    function getGradient(ctx: CanvasRenderingContext2D, width: number) {
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      for (const stop of GRADIENT_COLORS) {
        grad.addColorStop(stop.stop, stop.color);
      }
      return grad;
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 1;
      // Center waveform vertically
      const centerY = height / 2;
      const barWidth = Math.max(1, Math.floor(width / (NUM_BARS * 1.2)));
      const gap = (width - NUM_BARS * barWidth) / (NUM_BARS + 1);
      const now = Date.now();
      // Gradient for bars
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = getGradient(ctx, width);
      for (let i = 0; i < NUM_BARS; i++) {
        // Sine wave for smooth animation
        const phase = (i / NUM_BARS) * Math.PI * 2;
        const t = now / 900 + phase * 1.2;
        let amplitude = Math.sin(t) * 48 + Math.sin(t * 0.37 + i) * 18;
        // Ripple effect
        if (rippleRef.current) {
          const rippleX = rippleRef.current.x;
          const rippleT = (now - rippleRef.current.t) / 1000;
          const dist = Math.abs((gap + i * (barWidth + gap)) - rippleX);
          const rippleStrength = Math.max(0, 1 - rippleT * 1.5);
          if (rippleStrength > 0.01) {
            amplitude += Math.sin(rippleT * 8 - dist / 32) * 32 * rippleStrength * Math.exp(-dist / 320);
          } else {
            rippleRef.current = null;
          }
        }
        const barHeight = Math.max(8, 64 + amplitude);
        const x = gap + i * (barWidth + gap);
        const y = centerY - barHeight / 2;
        ctx.beginPath();
        ctx.moveTo(x + barWidth / 2, y);
        ctx.lineTo(x + barWidth / 2, y + barHeight);
        ctx.lineWidth = barWidth;
        ctx.strokeStyle = getGradient(ctx, width);
        ctx.stroke();
      }
      ctx.restore();
      requestAnimationFrame(draw);
    }
    draw();
    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100vw',
        height: '220px',
        margin: '0 auto',
        background: 'transparent',
        zIndex: 0,
        opacity: 1,
        transition: 'opacity 0.3s',
        position: 'relative',
      }}
      aria-hidden="true"
    />
  );
} 