import { NextRequest } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  console.log("ELEVENLABS_API_KEY loaded:", !!process.env.ELEVENLABS_API_KEY);
  const { text, voice } = await req.json();
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
      { text },
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );
    return new Response(response.data, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    let message = 'Unknown error';
    let status = 500;
    if (axios.isAxiosError(error)) {
      message = error.message;
      status = error.response?.status || 500;
    } else if (error instanceof Error) {
      message = error.message;
    }
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 