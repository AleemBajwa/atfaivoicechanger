"use client";
import React, { useRef, useEffect, useState } from 'react';

const WAVE_GRADIENTS = [
  ['#6a82fb', '#fc5c7d'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
];

export default function BackgroundWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const [micMode, setMicMode] = useState(false);
  const audioData = useRef<number[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  // Microphone setup
  useEffect(() => {
    if (!micMode) return;
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array;
    let source: MediaStreamAudioSourceNode;
    let stream: MediaStream;
    let running = true;

    async function setupMic() {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioCtx = new (window.AudioContext || ((window as unknown) as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;
      function getAudio() {
        if (!running || !analyser) return;
        analyser.getByteTimeDomainData(dataArray);
        // Normalize and store
        audioData.current = Array.from(dataArray).map(v => (v - 128) / 128);
        requestAnimationFrame(getAudio);
      }
      getAudio();
    }
    setupMic();
    return () => {
      running = false;
      if (audioCtx) audioCtx.close();
      if (stream) stream.getTracks().forEach(track => track.stop());
      analyserRef.current = null;
    };
  }, [micMode]);

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
      // Draw multiple layered waves
      for (let i = 0; i < WAVE_GRADIENTS.length; i++) {
        const [start, end] = WAVE_GRADIENTS[i];
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, start);
        grad.addColorStop(1, end);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5 + i * 2;
        ctx.globalAlpha = 0.35 + 0.15 * i;
        ctx.beginPath();
        const amplitude = 40 + 40 * i + 60 * mouse.current.y;
        const freq = 1.5 + i * 0.7 + 2 * mouse.current.x;
        for (let x = 0; x <= width; x += 3) {
          let y;
          if (micMode && audioData.current.length > 0) {
            // Use audio data for y offset
            const audioIdx = Math.floor((x / width) * audioData.current.length);
            const audioVal = audioData.current[audioIdx] || 0;
            y = height / 2 + Math.sin((x / width) * Math.PI * freq + frame * 0.02 + i) * amplitude * (0.7 + 0.3 * Math.sin(frame * 0.01 + i)) + audioVal * 80 * (1.2 - i * 0.3);
          } else {
            y = height / 2 + Math.sin((x / width) * Math.PI * freq + frame * 0.02 + i) * amplitude * Math.sin(frame * 0.01 + mouse.current.x * 2 + i);
          }
          // Add 3D effect by offsetting each layer
          y += (i - 1) * 18 * Math.sin(frame * 0.01 + i);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.shadowColor = start;
        ctx.shadowBlur = 24 - i * 6;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
      frame++;
      animationRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [micMode]);

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
      <button
        onClick={() => setMicMode(m => !m)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-[#6a82fb] to-[#fc5c7d] text-white px-5 py-3 rounded-full shadow-lg font-bold text-lg hover:scale-105 hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#fc5c7d] backdrop-blur-lg"
        style={{ pointerEvents: 'auto' }}
        aria-pressed={micMode ? "true" : "false"}
      >
        {micMode ? '🎤 Live Wave On' : '🎤 Live Wave Off'}
      </button>
    </>
  );
} 