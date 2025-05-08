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
      if (!result.error && !result.data.user) {
        // User already exists but is unconfirmed
        setError('You are already signed up. If you forgot your password, click "Forgot Password?" below to reset it.');
        setLoading(false);
        return;
      }
      if (!result.error) {
        // Check if user already exists in users table
        const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).single();
        if (existingUser) {
          setError('You are already signed up. If you forgot your password, click "Forgot Password?" below to reset it.');
          setLoading(false);
          return;
        }
        setSuccess("Signed up successfully! Check your email for confirmation.");
      }
      if (!result.error && result.data.user) {
        // Set initial credits in the users table
        await supabase.from('users').update({ credits: 100 }).eq('id', result.data.user.id);
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
      // Custom error for already registered user
      if (
        result.error.message.toLowerCase().includes("user already registered") ||
        result.error.message.toLowerCase().includes("user already exists") ||
        result.error.message.toLowerCase().includes("email already registered")
      ) {
        setError(
          'You are already signed up. If you forgot your password, click "Forgot Password?" below to reset it.'
        );
      } else {
        setError(result.error.message);
      }
    } else {
      onAuth?.();
    }
  };

  // Forgot password logic
  const handleForgotPassword = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Password reset email sent! Check your inbox.');
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
          className="rounded border px-3 py-2 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 focus:outline-none text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-300"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="rounded border px-3 py-2 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 focus:outline-none text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-300"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {mode === "signin" && (
          <button
            type="button"
            className="text-blue-600 hover:underline text-left text-sm"
            onClick={handleForgotPassword}
            disabled={loading || !email}
          >
            Forgot Password?
          </button>
        )}
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