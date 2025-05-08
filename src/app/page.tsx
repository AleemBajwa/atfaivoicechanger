"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AuthForm from "./auth";
import type { Session } from '@supabase/supabase-js';
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

// Define a type for usage history
interface UsageHistory {
  id: string;
  user_id: string;
  text: string;
  voice_id: string;
  chars_used: number;
  created_at: string;
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [input, setInput] = useState("");
  const [voice, setVoice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<UsageHistory[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const MAX_CHARS = 1000;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Fetch credits for the user
  useEffect(() => {
    if (session?.user.email) {
      supabase
        .from('users')
        .select('credits')
        .eq('email', session.user.email)
        .single()
        .then(({ data }) => setCredits(data?.credits ?? null));
    }
  }, [session]);

  // Fetch usage history
  useEffect(() => {
    if (session?.user.id) {
      supabase
        .from('usage_history')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setHistory(data ?? []));
    }
  }, [session]);

  // Redirect to reset-password if access_token is present in the URL
  useEffect(() => {
    if (searchParams.get("access_token")) {
      router.replace("/reset-password" + window.location.search);
    }
  }, [searchParams, router]);

  const handleConvert = async () => {
    setError(null);
    setSuccess(null);
    if (!input.trim()) {
      setError("Please enter some text.");
      return;
    }
    if (!voice) {
      setError("Please select a voice.");
      return;
    }
    const charsToDeduct = Math.ceil(input.length / 10);
    if (credits === null || credits < charsToDeduct) {
      setError("Not enough credits. Please top up.");
      return;
    }
    setProcessing(true);
    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: credits - charsToDeduct })
      .eq('email', session!.user.email);
    if (updateError) {
      setError("Failed to deduct credits. Try again.");
      setProcessing(false);
      return;
    }
    setCredits(credits - charsToDeduct);
    // Call ElevenLabs API via server-side route
    try {
      const response = await axios.post(
        "/api/elevenlabs",
        { text: input, voice },
        { responseType: "arraybuffer" }
      );
      const audioBlob = new Blob([response.data], { type: "audio/mpeg" });
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      await supabase.from('usage_history').insert({
        user_id: session!.user.id,
        text: input,
        voice_id: voice,
        chars_used: input.length,
      });
      const { data: newHistory } = await supabase
        .from('usage_history')
        .select('*')
        .eq('user_id', session!.user.id)
        .order('created_at', { ascending: false });
      setHistory(newHistory ?? []);
      setSuccess("Voice conversion successful!");
    } catch {
      setError("Voice conversion failed. Try again.");
    }
    setProcessing(false);
  };

  if (!session) {
    return <AuthForm onAuth={() => supabase.auth.getSession().then(({ data }) => setSession(data.session))} />;
  }

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only absolute top-2 left-2 bg-blue-600 text-white px-4 py-2 rounded z-50">Skip to main content</a>
      <main id="main-content" className="flex flex-col md:flex-row items-start justify-center min-h-[80vh] w-full px-2 sm:px-4 gap-8">
        {/* Centered Card */}
        <section className="w-full max-w-xl bg-white/20 dark:bg-zinc-900/30 rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-8 border border-white/30 dark:border-zinc-800/60 backdrop-blur-lg mt-16 animate-fade-in">
          <h1 className="text-4xl font-extrabold text-center mb-2 tracking-tight bg-gradient-to-r from-[#6a82fb] to-[#fc5c7d] bg-clip-text text-transparent drop-shadow-lg">AlChemist Voice Changer</h1>
          {/* Text Input */}
          <textarea
            className="w-full min-h-[100px] max-h-[200px] rounded-2xl border border-white/30 dark:border-zinc-700 bg-white/40 dark:bg-zinc-800/40 p-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#6a82fb] resize-none transition shadow-inner placeholder:text-gray-300 text-black dark:text-white"
            placeholder="Type your text here..."
            value={input}
            onChange={e => setInput(e.target.value)}
            aria-label="Text to convert"
            maxLength={MAX_CHARS}
          />
          <div className="w-full flex justify-between items-center text-sm mt-1">
            <span className={input.length > MAX_CHARS ? "text-red-400" : "text-gray-300"}>{input.length} / {MAX_CHARS} characters</span>
            {input.length > MAX_CHARS && <span className="text-red-400 ml-2">Max 1000 characters allowed</span>}
          </div>
          {/* Voice Selection */}
          <label htmlFor="voice-select" className="sr-only">Select a voice</label>
          <select
            id="voice-select"
            aria-label="Select a voice"
            className="w-full rounded-2xl border border-white/30 dark:border-zinc-700 bg-white/40 dark:bg-zinc-800/40 p-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#fc5c7d] transition shadow-inner text-black dark:text-white placeholder:text-gray-300"
            value={voice}
            onChange={e => setVoice(e.target.value)}
          >
            <option value="">Select a voice</option>
            <option value="29vD33N1CtxCmqQRPOHJ">Drew (Legacy)</option>
            <option value="2EiwWnXFnvU5JabPnv8n">Clyde (Legacy)</option>
            <option value="9BWtsMINqrJLrRacOk9x">Aria</option>
            <option value="5Q0t7uMcjvnagumLfvZi">Paul (Legacy)</option>
            <option value="ErXwobaYiN019PkySvjV">Antoni (Legacy)</option>
          </select>
          <div aria-live="polite" className="w-full">
            {error && <div className="text-red-500 text-base w-full text-center font-semibold">{error}</div>}
            {success && <div className="text-green-400 text-base w-full text-center font-semibold">{success}</div>}
          </div>
          {/* Convert Button */}
          <button
            className="w-full py-3 rounded-full bg-gradient-to-r from-[#6a82fb] to-[#fc5c7d] text-white font-bold text-xl shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#fc5c7d]"
            onClick={handleConvert}
            disabled={processing || input.length === 0 || input.length > MAX_CHARS}
          >
            {processing ? "Converting..." : "Convert"}
          </button>
          {/* Audio Player and Download */}
          {audioUrl && (
            <div className="w-full flex flex-col items-center gap-2 mt-4">
              <audio controls src={audioUrl} className="w-full" />
              <a
                href={audioUrl}
                download="converted-audio.mp3"
                className="mt-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#a78bfa] to-[#f472b6] text-white font-bold shadow hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#a78bfa]"
              >
                Download Audio
              </a>
            </div>
          )}
        </section>
        {/* History Sidebar */}
        <aside className="hidden md:flex flex-col w-96 max-w-full bg-white/30 dark:bg-zinc-900/40 rounded-3xl shadow-2xl p-6 mt-16 border border-white/30 dark:border-zinc-800/60 backdrop-blur-lg animate-fade-in h-[600px] overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4 text-white tracking-tight">History</h2>
          <div className="flex flex-col gap-4">
            {history.length === 0 && (
              <div className="bg-white/20 dark:bg-zinc-800/40 rounded-xl p-4 text-gray-200 dark:text-gray-300 shadow-inner">No history yet.</div>
            )}
            {history.map((item, idx) => (
              <div key={item.id || idx} className="bg-white/30 dark:bg-zinc-800/50 rounded-xl p-4 text-gray-800 dark:text-gray-200 shadow-inner border border-white/20 dark:border-zinc-700">
                <div className="font-semibold text-lg truncate" title={item.text}>{item.text}</div>
                <div className="text-xs mt-1">Voice: {item.voice_id} | {item.chars_used} chars</div>
                <div className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </>
  );
}
