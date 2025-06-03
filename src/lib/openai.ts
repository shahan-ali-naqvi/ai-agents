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