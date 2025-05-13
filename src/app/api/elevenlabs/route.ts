import { NextRequest } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  const { text, voice } = await req.json();
  
  if (!process.env.ELEVENLABS_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Server misconfiguration' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

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
      message = 'Text-to-speech failed.';
      status = error.response?.status || 500;
    } else if (error instanceof Error) {
      message = 'Text-to-speech failed.';
    }

    return new Response(
      JSON.stringify({ error: message }),
      { 
        status,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 