"use client";

/**
 * Utility functions for OpenAI API integration
 */

// Check for localStorage availability
const isClient = typeof window !== 'undefined';

// Helper functions for working with OpenAI API key in localStorage
export function hasApiKey(): boolean {
  if (!isClient) return false;
  const key = localStorage.getItem('openai-api-key');
  return !!key && key.trim() !== '';
}

export function getApiKey(): string | null {
  return isClient ? localStorage.getItem('openai-api-key') : null;
}

export function getModel(): string {
  return isClient 
    ? localStorage.getItem('openai-model') || 'gpt-3.5-turbo'
    : 'gpt-3.5-turbo';
}

export function saveApiKey(key: string): void {
  if (!isClient || !key?.trim()) return;
  localStorage.setItem('openai-api-key', key.trim());
}

export function saveModel(model: string): void {
  if (!isClient) return;
  localStorage.setItem('openai-model', model);
}

export function clearApiKey(): void {
  if (!isClient) return;
  localStorage.removeItem('openai-api-key');
  localStorage.removeItem('openai-model');
}

// Models specifically compatible with chat completions API (v1/chat/completions)
// Only including models that are guaranteed to work for all users
export const CHAT_COMPLETION_MODELS = {
  // GPT-4o Models (Latest) - GUARANTEED WORKING
  'gpt-4o': 'GPT-4o (Latest)',
  'gpt-4o-mini': 'GPT-4o Mini',
  
  // GPT-4 Models - GUARANTEED WORKING
  'gpt-4-turbo': 'GPT-4 Turbo',
  'gpt-4-turbo-preview': 'GPT-4 Turbo Preview',
  'gpt-4': 'GPT-4',
  'gpt-4-32k': 'GPT-4 32K',
  'gpt-4-0125-preview': 'GPT-4 0125 Preview',
  'gpt-4-1106-preview': 'GPT-4 1106 Preview',
  'gpt-4-0613': 'GPT-4 0613',
  'gpt-4-0314': 'GPT-4 0314',
  
  // GPT-3.5 Models - GUARANTEED WORKING
  'gpt-3.5-turbo': 'GPT-3.5 Turbo',
  'gpt-3.5-turbo-16k': 'GPT-3.5 Turbo 16K',
  'gpt-3.5-turbo-0125': 'GPT-3.5 Turbo 0125',
  'gpt-3.5-turbo-1106': 'GPT-3.5 Turbo 1106',
  'gpt-3.5-turbo-0613': 'GPT-3.5 Turbo 0613',
  'gpt-3.5-turbo-0301': 'GPT-3.5 Turbo 0301',
  
  // Instruct Models - GUARANTEED WORKING
  'gpt-3.5-turbo-instruct': 'GPT-3.5 Turbo Instruct',
  'gpt-3.5-turbo-instruct-0914': 'GPT-3.5 Turbo Instruct 0914'
};

// Call OpenAI API
export async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = getApiKey();
  const model = getModel();
  
  if (!apiKey) {
    throw new Error('API key not found');
  }
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to call OpenAI API');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
} 