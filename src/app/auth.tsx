"use client";
import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthForm({ onAuth }: { onAuth?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    let result;
    if (mode === "signin") {
      result = await supabase.auth.signInWithPassword({ email, password });
      if (!result.error) setSuccess("Signed in successfully!");
    } else {
      result = await supabase.auth.signUp({ email, password });
      if (!result.error) setSuccess("Signed up successfully! Check your email for confirmation.");
      if (!result.error && result.data.user) {
        await supabase.from('credits').insert({ user_id: result.data.user.id, balance: 100 });
        // Send email to Google Sheets webhook
        fetch(process.env.GOOGLE_SHEETS_WEBHOOK_URL!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      }
    }
    setLoading(false);
    if (result.error) {
      setError(result.error.message);
    } else {
      onAuth?.();
    }
  };

  return (
    <div className="w-full max-w-xs mx-auto bg-white dark:bg-zinc-900 rounded-xl shadow p-6 mt-10">
      <h2 className="text-xl font-bold mb-4 text-center">
        {mode === "signin" ? "Sign In" : "Sign Up"}
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          className="rounded border px-3 py-2 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 focus:outline-none"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="rounded border px-3 py-2 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 focus:outline-none"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition"
          disabled={loading}
        >
          {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Sign Up"}
        </button>
      </form>
      <div className="text-center mt-4">
        {mode === "signin" ? (
          <span>
            Don&apos;t have an account?{' '}
            <button className="text-blue-600 hover:underline" onClick={() => setMode("signup")}>Sign Up</button>
          </span>
        ) : (
          <span>
            Already have an account?{' '}
            <button className="text-blue-600 hover:underline" onClick={() => setMode("signin")}>Sign In</button>
          </span>
        )}
      </div>
    </div>
  );
} 