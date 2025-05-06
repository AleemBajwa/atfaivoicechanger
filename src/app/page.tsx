"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AuthForm from "./auth";
import type { Session } from '@supabase/supabase-js';
import axios from "axios";

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
  const [session, setSession] = useState<Session | null>(null);
  const [input, setInput] = useState("");
  const [voice, setVoice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<UsageHistory[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

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
    if (session?.user.id) {
      supabase
        .from('credits')
        .select('balance')
        .eq('user_id', session.user.id)
        .single()
        .then(({ data }) => setCredits(data?.balance ?? null));
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
    if (credits === null || credits < 1) {
      setError("Not enough credits. Please top up.");
      return;
    }
    setProcessing(true);
    // Deduct 1 credit per conversion (customize as needed)
    const { error: updateError } = await supabase
      .from('credits')
      .update({ balance: credits - 1 })
      .eq('user_id', session!.user.id);
    if (updateError) {
      setError("Failed to deduct credits. Try again.");
      setProcessing(false);
      return;
    }
    setCredits(credits - 1);
    // Call ElevenLabs API
    try {
      const response = await axios.post(
        "https://api.elevenlabs.io/v1/text-to-speech/" + process.env.ELEVENLABS_VOICE_ID,
        {
          text: input,
        },
        {
          headers: {
            "xi-api-key": process.env.ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
          responseType: "arraybuffer",
        }
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
      <main id="main-content" className="flex flex-col items-center justify-center min-h-[80vh] w-full px-2 sm:px-4">
        {/* Centered Card */}
        <section className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-4 sm:p-8 flex flex-col items-center gap-6 border border-gray-100 dark:border-zinc-800 mt-8 sm:mt-12">
          <h1 className="text-2xl font-bold mb-2 text-center">AI Voice Changer</h1>
          {/* Text Input */}
          <textarea
            className="w-full min-h-[100px] max-h-[200px] rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition"
            placeholder="Type your text here..."
            value={input}
            onChange={e => setInput(e.target.value)}
            aria-label="Text to convert"
          />
          {/* Voice Selection */}
          <label htmlFor="voice-select" className="sr-only">Select a voice</label>
          <select
            id="voice-select"
            aria-label="Select a voice"
            className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            value={voice}
            onChange={e => setVoice(e.target.value)}
          >
            <option value="">Select a voice</option>
            <option value="voice1">Voice 1</option>
            <option value="voice2">Voice 2</option>
          </select>
          <div aria-live="polite" className="w-full">
            {error && <div className="text-red-500 text-sm w-full text-center">{error}</div>}
            {success && <div className="text-green-600 text-sm w-full text-center">{success}</div>}
          </div>
          {/* Convert Button */}
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition text-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={handleConvert}
            disabled={processing}
            aria-disabled={processing ? "true" : "false"}
          >
            {processing ? "Converting..." : "Convert"}
          </button>
        </section>
        {/* Results/History Area */}
        <section className="w-full max-w-xl mt-6 sm:mt-10">
          <h2 className="text-lg font-semibold mb-4">History</h2>
          {audioUrl && (
            <div className="mb-6 flex flex-col items-center">
              <audio controls src={audioUrl} className="w-full" />
              <div className="text-xs text-gray-500 mt-2">Most recent result</div>
            </div>
          )}
          <div className="flex flex-col gap-4">
            {history.length === 0 && (
              <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-4 text-gray-700 dark:text-gray-200">No history yet.</div>
            )}
            {history.map((item, idx) => (
              <div key={item.id || idx} className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-4 text-gray-700 dark:text-gray-200">
                <div className="font-semibold">{item.text}</div>
                <div className="text-xs mt-1">Voice: {item.voice_id} | {item.chars_used} chars</div>
                <div className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
