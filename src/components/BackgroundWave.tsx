"use client";
import React, { useRef, useEffect, useState } from 'react';

export default function BackgroundWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      analyser.fftSize = 64;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;
      function getAudio() {
        if (!running || !analyser) return;
        analyser.getByteFrequencyData(dataArray);
        audioData.current = Array.from(dataArray).map(v => v / 255);
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

    let frame = 0;
    const BAR_COUNT = 64;
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      // Bar spectrum
      const barWidth = width / BAR_COUNT;
      for (let i = 0; i < BAR_COUNT; i++) {
        // Color gradient for bars
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#6a82fb');
        grad.addColorStop(0.5, '#fc5c7d');
        grad.addColorStop(1, '#fee140');
        ctx.fillStyle = grad;
        // Animate bar height
        let barHeight;
        if (micMode && audioData.current.length > 0) {
          barHeight = (audioData.current[i] || 0.1) * (height * 0.5 + Math.sin(frame * 0.05 + i) * 20);
        } else {
          barHeight = (Math.abs(Math.sin(frame * 0.03 + i)) * 0.7 + 0.3) * (height * 0.4 + Math.sin(frame * 0.05 + i) * 20);
        }
        ctx.fillRect(i * barWidth, height - barHeight, barWidth * 0.7, barHeight);
      }
      frame++;
      animationRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      window.removeEventListener('resize', handleResize);
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
        aria-pressed={micMode ? 'true' : 'false'}
      >
        {micMode ? '🎤 Live Bars On' : '🎤 Live Bars Off'}
      </button>
    </>
  );
} 