import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    
    if (!userId) {
      console.error('No user ID in session metadata');
      return NextResponse.json({ error: 'No user ID in session metadata' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    try {
      // Increment credits for the user
      const { error } = await supabase.rpc('increment_credits', {
        user_id: userId,
        amount: 500 // 500 credits per purchase
      });

      if (error) {
        console.error('Error incrementing credits:', error);
        return NextResponse.json({ error: 'Failed to increment credits' }, { status: 500 });
      }

      // Log the successful purchase
      await supabase.from('purchases').insert({
        user_id: userId,
        amount: 500,
        credits: 500,
        stripe_session_id: session.id,
        status: 'completed'
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
} 