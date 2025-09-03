import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// List of models compatible with chat completions API
// Only including models that are guaranteed to work for all users
const COMPATIBLE_MODELS = [
  'gpt-4o', 'gpt-4o-mini',
  'gpt-4-turbo', 'gpt-4-turbo-preview', 'gpt-4', 'gpt-4-32k',
  'gpt-4-0125-preview', 'gpt-4-1106-preview', 'gpt-4-0613', 'gpt-4-0314',
  'gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-3.5-turbo-0125',
  'gpt-3.5-turbo-1106', 'gpt-3.5-turbo-0613', 'gpt-3.5-turbo-0301',
  'gpt-3.5-turbo-instruct', 'gpt-3.5-turbo-instruct-0914'
];

export async function POST(req: NextRequest) {
  try {
    const { inputStatement, instructions, requiredOutput, apiKey: clientApiKey, model = 'gpt-3.5-turbo' } = await req.json();
    
    console.log('API Request received:', { model, hasApiKey: !!clientApiKey, inputLength: inputStatement?.length });
    
    // Validate model compatibility
    if (!COMPATIBLE_MODELS.includes(model)) {
      console.log('Invalid model requested:', model);
      return NextResponse.json({ 
        error: `Model '${model}' is not compatible with the chat completions API. Please use a compatible model like gpt-3.5-turbo, gpt-4o, or gpt-4.` 
      }, { status: 400 });
    }
    
    // Try client-provided API key first, then fall back to server environment variable
    const apiKey = clientApiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.log('No API key provided');
      return NextResponse.json({ error: 'OpenAI API key not set.' }, { status: 500 });
    }

    console.log('Making OpenAI API call with model:', model);
    const openai = new OpenAI({ apiKey });

    const prompt = `You are an expert assistant.\n\nInput Statement:\n${inputStatement}\n\nInstructions:\n${instructions}\n\nRequired Output:\n${requiredOutput}\n\nPlease provide the output as requested.`;

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
    console.log('OpenAI API call successful');
    return NextResponse.json({ result });
    
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    
    // Provide more specific error messages
    if (error.status === 400) {
      return NextResponse.json({ 
        error: `Invalid request: ${error.message}` 
      }, { status: 400 });
    } else if (error.status === 401) {
      return NextResponse.json({ 
        error: 'Invalid API key. Please check your OpenAI API key.' 
      }, { status: 401 });
    } else if (error.status === 429) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Please try again later.' 
      }, { status: 429 });
    } else if (error.status === 500) {
      return NextResponse.json({ 
        error: `OpenAI server error: ${error.message}` 
      }, { status: 500 });
    } else {
      return NextResponse.json({ 
        error: `OpenAI API error: ${error.message || 'Unknown error occurred'}` 
      }, { status: 500 });
    }
  }
} 