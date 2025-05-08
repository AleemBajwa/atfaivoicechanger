"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get("access_token");
    if (t) setToken(t);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!token) {
      setError("Invalid or missing token.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Password reset successful! You can now sign in with your new password.");
      setTimeout(() => router.push("/"), 2000);
    }
  };

  return (
    <div className="w-full max-w-xs mx-auto bg-white dark:bg-zinc-900 rounded-xl shadow p-6 mt-10">
      <h2 className="text-xl font-bold mb-4 text-center">Reset Password</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="password"
          className="rounded border px-3 py-2 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 focus:outline-none text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-300"
          placeholder="New Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          className="rounded border px-3 py-2 bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 focus:outline-none text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-300"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition"
          disabled={loading || !password || !confirmPassword || password !== confirmPassword}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
} 