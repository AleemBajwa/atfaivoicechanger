"use client";
import React, { useRef, useEffect } from 'react';

const WAVE_GRADIENT_START = '#6a82fb';
const WAVE_GRADIENT_END = '#fc5c7d';

export default function BackgroundWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX / width;
      mouse.current.y = e.clientY / height;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let frame = 0;
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      // Create gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, WAVE_GRADIENT_START);
      grad.addColorStop(1, WAVE_GRADIENT_END);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.7;
      // Draw wave
      ctx.beginPath();
      const amplitude = 60 + 80 * mouse.current.y;
      const freq = 2 + 3 * mouse.current.x;
      for (let x = 0; x <= width; x += 4) {
        const t = (x / width) * Math.PI * freq + frame * 0.03;
        const y = height / 2 + Math.sin(t) * amplitude * Math.sin(frame * 0.01 + mouse.current.x * 2);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.shadowColor = WAVE_GRADIENT_START;
      ctx.shadowBlur = 24;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      frame++;
      requestAnimationFrame(draw);
    }
    draw();
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.7,
        transition: 'opacity 0.3s',
      }}
      aria-hidden="true"
    />
  );
} 