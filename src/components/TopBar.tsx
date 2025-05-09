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
    <header className="w-full flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 py-4 border-b" style={{ background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary-dark)' }}>
      <div className="flex items-center gap-4">
        <span className="font-extrabold text-3xl tracking-tight" style={{ background: 'none', color: '#fff', textShadow: '0 2px 2px rgba(0,0,0,0.10)' }}>AlChemist Voice Changer</span>
      </div>
      <div className="flex items-center gap-6">
        {/* Credit Balance */}
        <span className="text-sm px-3 py-1 rounded-full" style={{ background: 'var(--gray-100)', color: 'var(--primary)', fontWeight: 600 }}>
          Credits: {loadingCredits ? '...' : credits !== null ? credits : '--'}
        </span>
        <button
          className="ml-2 px-3 py-1 rounded transition text-sm focus:outline-none focus:ring-2"
          style={{ background: 'var(--primary-light)', color: '#fff', border: 'none', boxShadow: 'var(--shadow-card)', fontWeight: 600 }}
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
            <span className="text-sm" style={{ color: '#fff' }}>{session.user.email}</span>
            <button
              className="px-3 py-1 rounded transition"
              style={{ background: 'var(--gray-100)', color: 'var(--primary)', fontWeight: 600 }}
              onClick={async () => { await supabase.auth.signOut(); }}
            >Sign Out</button>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: 'var(--gray-100)', color: 'var(--primary)' }}>U</div>
        )}
      </div>
    </header>
  );
} 