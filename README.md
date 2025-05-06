# AI Voice Changer

A web-based voice changer app using Next.js, Supabase, Stripe, and ElevenLabs.

## Features
- User authentication (Supabase)
- Credit system (free credits, usage, top-up)
- Voice changer (ElevenLabs API)
- Stripe payments for credit top-up
- Lead capture (Google Sheets)

## Getting Started

### 1. Clone the repository
```bash
# Clone this repo and cd into it
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file in the root with the following:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_PROJECT_ID=your-supabase-project-id
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_VOICE_ID=your-elevenlabs-voice-id
STRIPE_SECRET_KEY=your-stripe-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
GOOGLE_SHEETS_WEBHOOK_URL=your-google-sheets-webhook-url
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### 5. Deploy
- Recommended: [Vercel](https://vercel.com/)
- Set all environment variables in your deployment platform

## Database Setup
- Run the SQL in the requirements to create the `credits`, `usage_history`, and `payments` tables.
- Add the `increment_credits` function for Stripe webhook support.

## Stripe Webhook
- Set up a Stripe webhook endpoint for `/api/stripe-webhook` and use the signing secret in `STRIPE_WEBHOOK_SECRET`.

## Support
For issues, open an issue in this repo or contact the project maintainer.
