import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '../../../lib/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

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
    return NextResponse.json({ error: 'Webhook signature verification failed.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    // In a real implementation, you would pass the user_id in the session metadata
    // For demo, you may need to look up the user by email or another identifier
    // Here, we assume the email is available
    const email = session.customer_details?.email;
    if (email) {
      // Find user by email
      const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
      if (user) {
        // Add 500 credits
        await supabase.rpc('increment_credits', { user_id: user.id, amount: 500 });
      }
    }
  }
  return NextResponse.json({ received: true });
} 