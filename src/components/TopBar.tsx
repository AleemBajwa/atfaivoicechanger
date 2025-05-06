"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Session } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function TopBar() {
  const [session, setSession] = useState<Session | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchCredits = async () => {
      if (session?.user.email) {
        setLoadingCredits(true);
        const { data, error } = await supabase
          .from('users')
          .select('credits')
          .eq('email', session.user.email)
          .single();
        if (data && !error) {
          setCredits(data.credits);
        } else {
          setCredits(null);
        }
        setLoadingCredits(false);
      } else {
        setCredits(null);
      }
    };
    fetchCredits();
  }, [session]);

  return (
    <header className="w-full flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 py-4 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur z-10 sticky top-0">
      <div className="flex items-center gap-2">
        <span className="font-bold text-xl tracking-tight">AI Voice Changer</span>
      </div>
      <div className="flex items-center gap-6">
        {/* Credit Balance */}
        <span className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 px-3 py-1 rounded-full">
          Credits: {loadingCredits ? '...' : credits !== null ? credits : '--'}
        </span>
        <button
          className="ml-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          onClick={() => setShowTopUp(true)}
          aria-label="Top up credits"
        >Top Up</button>
        {/* User Profile or Auth */}
        {session ? (
          <div className="flex items-center gap-3">
            <span className="text-gray-700 dark:text-gray-200 text-sm">{session.user.email}</span>
            <button
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              onClick={async () => { await supabase.auth.signOut(); }}
            >Sign Out</button>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold">U</div>
        )}
      </div>
      {showTopUp && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8 max-w-sm w-full flex flex-col items-center" tabIndex={-1}>
            <h3 className="text-lg font-bold mb-4">Buy Credits</h3>
            <div className="mb-4">$5 for 500 credits</div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={async () => {
                const stripe = await stripePromise;
                const res = await fetch("/api/create-checkout-session", { method: "POST" });
                const data = await res.json();
                await stripe?.redirectToCheckout({ sessionId: data.sessionId });
              }}
              aria-label="Buy 500 credits for $5"
            >Buy</button>
            <button className="mt-2 px-4 py-2 bg-gray-300 dark:bg-zinc-700 rounded hover:bg-gray-400 dark:hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-gray-500" onClick={() => setShowTopUp(false)} aria-label="Close buy credits modal">Close</button>
          </div>
        </div>
      )}
    </header>
  );
} 