"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ApiKeySettings from '@/components/ApiKeySettings';
import { hasApiKey } from '@/lib/openai';

export default function ApiSettingsPage() {
  const [hasKey, setHasKey] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    setHasKey(hasApiKey());
  }, []);
  
  // Don't render during SSR to prevent hydration mismatch
  if (!isClient) return null;
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-white to-[#F5F3ED]">
      <div className="w-full max-w-4xl px-4 sm:px-6 md:px-8 py-8 md:py-12">
        {/* Page navigation */}
        <div className="flex justify-center mb-6 space-x-4">
          <Link href="/chain" className="px-4 py-2 gradient-bg text-white rounded-md hover:opacity-90">
            Chain
          </Link>
          <Link href="/ports" className="px-4 py-2 gradient-bg text-white rounded-md hover:opacity-90">
            Ports
          </Link>
          <Link href="/api-settings" className="px-4 py-2 bg-[#A46E44] text-white rounded-md">
            API Settings
          </Link>
        </div>
      
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 sm:mb-6 gradient-text">API Settings</h1>
        <p className="text-center mb-6 text-[#382A22] max-w-2xl mx-auto text-sm sm:text-base">
          Configure your OpenAI API key settings to use AI-powered features
        </p>
        
        <div className="w-full max-w-xl mx-auto">
          <ApiKeySettings onSave={() => setHasKey(true)} />
        </div>
        
        {hasKey && (
          <div className="text-center mt-6 bg-green-50 border border-green-100 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-green-600 mb-4 font-medium">✓ API key saved successfully!</p>
            <Link href="/chain">
              <span className="text-[#BE8A60] hover:underline font-medium">Go to Chain Process</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 