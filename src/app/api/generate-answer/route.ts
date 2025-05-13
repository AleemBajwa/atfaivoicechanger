import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano-2025-04-14',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful question answering AI assistant that provides concise, accurate, and engaging answers to questions. '
        },
        { role: 'user', content: question }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return NextResponse.json({
      answer: response.choices[0].message.content
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate answer' },
      { status: 500 }
    );
  }
} 