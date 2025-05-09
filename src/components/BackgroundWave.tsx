"use client";
import React, { useRef, useEffect } from 'react';

export default function BackgroundWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

    let frame = 0;
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      // Draw a single flowing sinewave
      const grad = ctx.createLinearGradient(0, height / 2, width, height / 2);
      grad.addColorStop(0, '#6a82fb');
      grad.addColorStop(0.5, '#fc5c7d');
      grad.addColorStop(1, '#fee140');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      const amplitude = height * 0.12;
      const frequency = 2.2;
      const speed = 0.025;
      for (let x = 0; x <= width; x += 2) {
        const y = height / 2 + Math.sin((x / width) * Math.PI * frequency * 2 + frame * speed) * amplitude * (0.7 + 0.3 * Math.sin(frame * 0.01));
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.shadowColor = '#fc5c7d';
      ctx.shadowBlur = 16;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      frame++;
      animationRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <>
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
    </>
  );
} 