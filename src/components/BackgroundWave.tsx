"use client";
import React, { useRef, useEffect } from 'react';

interface Ripple {
  x: number;
  t: number;
}

export default function BackgroundWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripples = useRef<Ripple[]>([]);
  const animationRef = useRef<number | undefined>(undefined);

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
      ripples.current.push({ x: e.clientX, t: 0 });
    };
    window.addEventListener('mousemove', handleMouseMove);

    let frame = 0;
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      // Gradient for the wave
      const grad = ctx.createLinearGradient(0, height / 2, width, height / 2);
      grad.addColorStop(0, '#43e97b');
      grad.addColorStop(0.3, '#38f9d7');
      grad.addColorStop(0.5, '#6a82fb');
      grad.addColorStop(0.7, '#fc5c7d');
      grad.addColorStop(1, '#fee140');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      const amplitude = height * 0.13;
      const frequency = 2.2;
      const speed = 0.025;
      // Draw the wave with ripples
      for (let x = 0; x <= width; x += 2) {
        // Base sinewave
        let y = height / 2 + Math.sin((x / width) * Math.PI * frequency * 2 + frame * speed) * amplitude;
        // Add ripple effects
        for (const ripple of ripples.current) {
          const dist = x - ripple.x;
          const rippleAmp = amplitude * 0.5 * Math.exp(-Math.abs(dist) / 120) * Math.exp(-ripple.t / 40);
          y += Math.sin((dist / 18) - ripple.t * 0.18) * rippleAmp;
        }
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.shadowColor = '#fc5c7d';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      // Animate ripples
      for (const ripple of ripples.current) {
        ripple.t += 1;
      }
      // Remove faded ripples
      ripples.current = ripples.current.filter(r => r.t < 80);
      frame++;
      animationRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
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