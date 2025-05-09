"use client";
import React, { useRef, useEffect, useState } from 'react';

const BAR_COLORS = [
  'var(--primary)',
  'var(--primary-light)',
  'var(--accent-1)',
  'var(--accent-2)',
];
const NUM_BARS = 100;

export default function BackgroundWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [micMode, setMicMode] = useState(false);
  const audioData = useRef<number[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const mouse = useRef({ x: 0.5, y: 0.5 });

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
      const barWidth = width / NUM_BARS;
      for (let i = 0; i < NUM_BARS; i++) {
        let barHeight;
        const distortion = Math.sin(frame * 0.04 + i * 0.2 + mouse.current.x * 5 + mouse.current.y * 5) * 40 * mouse.current.y;
        if (micMode && audioData.current.length > 0) {
          // Use audio data for bar height
          const audioIdx = Math.floor((i / NUM_BARS) * audioData.current.length);
          const audioVal = audioData.current[audioIdx] || 0;
          barHeight = (height / 3) * (0.5 + Math.abs(audioVal)) + distortion;
        } else {
          // Animate randomly
          barHeight = (height / 3) * (0.3 + 0.7 * Math.abs(Math.sin(frame * 0.03 + i))) + distortion;
        }
        ctx.fillStyle = BAR_COLORS[i % BAR_COLORS.length];
        ctx.fillRect(
          i * barWidth + barWidth * 0.4,
          height / 2 - barHeight / 2,
          barWidth * 0.2,
          barHeight
        );
      }
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
        className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-full shadow-lg font-bold text-lg hover:scale-105 hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 backdrop-blur-lg"
        style={{
          pointerEvents: 'auto',
          background: 'linear-gradient(90deg, var(--primary), var(--primary-light))',
          color: '#fff',
        }}
        aria-pressed={micMode ? 'true' : 'false'}
      >
        {micMode ? '🎤 Live Bars On' : '🎤 Live Bars Off'}
      </button>
    </>
  );
} 