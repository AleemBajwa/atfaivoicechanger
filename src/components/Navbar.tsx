'use client'

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { Menu, X, Zap, MessageSquare, ChevronDown } from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '../lib/supabaseClient'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function Navbar() {
  const handleTopUp = async () => {
    const stripe = await stripePromise;
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) {
      // Handle unauthenticated state - maybe redirect to login
      return;
    }

    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      // Handle error - maybe show a toast/notification
      return;
    }
    
    const data = await res.json();
    await stripe?.redirectToCheckout({ sessionId: data.sessionId });
  };

  // ... rest of the component code ...
} 