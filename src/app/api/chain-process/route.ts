import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  const { inputStatement, instructions, requiredOutput, apiKey: clientApiKey, model = 'gpt-3.5-turbo' } = await req.json();
  
  // Try client-provided API key first, then fall back to server environment variable
  const apiKey = clientApiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'OpenAI API key not set.' }, { status: 500 });
  }

  const openai = new OpenAI({ apiKey });

  const prompt = `You are an expert assistant.\n\nInput Statement:\n${inputStatement}\n\nInstructions:\n${instructions}\n\nRequired Output:\n${requiredOutput}\n\nPlease provide the output as requested.`;

  try {
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 600,
    });
    const result = completion.choices[0]?.message?.content || 'No result.';
    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'OpenAI error.' }, { status: 500 });
  }
} 