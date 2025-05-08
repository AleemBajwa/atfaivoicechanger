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
    <header className="w-full flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 py-4 border-b border-purple-900/40 bg-black/60 backdrop-blur-lg z-20 sticky top-0 shadow-lg">
      <div className="flex items-center gap-4">
        <span className="font-extrabold text-3xl tracking-tight bg-gradient-to-r from-[#a78bfa] to-[#f472b6] bg-clip-text text-transparent drop-shadow-lg select-none">AlChemist Voice Changer</span>
      </div>
      <div className="flex items-center gap-6">
        {/* Credit Balance */}
        <span className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 px-3 py-1 rounded-full">
          Credits: {loadingCredits ? '...' : credits !== null ? credits : '--'}
        </span>
        <button
          className="ml-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          onClick={async () => {
            const stripe = await stripePromise;
            const res = await fetch("/api/create-checkout-session", { method: "POST" });
            const data = await res.json();
            await stripe?.redirectToCheckout({ sessionId: data.sessionId });
          }}
          aria-label="Top up credits"
        >
          Top Up
        </button>
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
    </header>
  );
} 