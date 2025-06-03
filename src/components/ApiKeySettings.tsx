"use client";

import React, { useState, useEffect } from 'react';
import { hasApiKey, getApiKey, getModel, saveApiKey, saveModel, clearApiKey } from '@/lib/openai';

// Type definition for props
interface ApiKeySettingsProps {
  onSave?: () => void;
}

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ onSave }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [isKeySet, setIsKeySet] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Initialize state from localStorage
  useEffect(() => {
    setIsClient(true);
    setIsKeySet(hasApiKey());
    setModel(getModel());
    
    const storedKey = getApiKey();
    if (storedKey) setApiKey(storedKey);
  }, []);

  const handleSaveSettings = () => {
    if (!apiKey.trim()) return;
    
    saveApiKey(apiKey);
    saveModel(model);
    setShowSettings(false);
    setIsKeySet(true);
    onSave?.();
  };

  // Only render after client-side hydration
  if (!isClient) return null;

  if (showSettings) {
    return (
      <div className="bg-white sm:bg-[#F5F3ED] border border-[#D6D1C2] rounded-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 shadow-sm sm:shadow">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-[#382A22]">OpenAI API Settings</h2>
        <p className="text-[#382A22] text-sm sm:text-base mb-4">
          Enter your OpenAI API key to enable AI-generated content. Your key is stored locally in your browser.
        </p>
        
        <div className="mb-4 sm:mb-5">
          <label className="block text-sm font-medium text-[#382A22] mb-1">API Key</label>
          <div className="relative">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 sm:p-3 pr-10 border border-[#B09780] rounded-lg text-[#382A22] focus:ring-2 focus:ring-[#D4A77C] focus:border-[#BE8A60] text-sm sm:text-base"
              placeholder="Enter your OpenAI API key"
            />
            <button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#382A22] hover:text-[#BE8A60]"
              onClick={() => {
                const input = document.querySelector('input[type="password"]');
                if (input) {
                  input.setAttribute('type', 
                    input.getAttribute('type') === 'password' ? 'text' : 'password'
                  );
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
          <div className="text-xs sm:text-sm text-[#382A22] mt-1">
            Get your API key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[#BE8A60] hover:underline">platform.openai.com/api-keys</a>
          </div>
        </div>
        
        <div className="mb-5 sm:mb-6">
          <label className="block text-sm font-medium text-[#382A22] mb-1">OpenAI Model</label>
          <div className="relative">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full p-2 sm:p-3 border border-[#B09780] rounded-lg focus:ring-2 focus:ring-[#D4A77C] focus:border-[#BE8A60] appearance-none bg-white text-sm sm:text-base"
            >
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </select>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="text-xs sm:text-sm text-[#382A22] mt-1">
            GPT-3.5 Turbo is faster and more cost-effective for most use cases
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleSaveSettings}
            className="gradient-bg text-white py-2 px-6 rounded-lg hover:opacity-90 shadow transition-colors text-sm sm:text-base font-medium"
          >
            Save Settings
          </button>
          <button
            onClick={() => setShowSettings(false)}
            className="bg-[#E0DCD0] text-[#382A22] py-2 px-6 rounded-lg hover:bg-[#D6D1C2] transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }
  
  if (isKeySet) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-6 sm:mb-8 flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-0">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium text-sm sm:text-base">OpenAI API Key Set</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="text-xs sm:text-sm px-3 py-1 bg-[#F5F3ED] hover:bg-[#E0DCD0] rounded-md transition-colors"
          >
            Update
          </button>
          <button
            onClick={() => {
              clearApiKey();
              setApiKey('');
              setModel('gpt-3.5-turbo');
              setIsKeySet(false);
            }}
            className="text-xs sm:text-sm px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <button
      onClick={() => setShowSettings(true)}
      className="w-full sm:w-auto mb-6 sm:mb-8 flex items-center justify-center gap-2 mx-auto px-4 py-2 sm:px-5 sm:py-3 border border-[#D6D1C2] rounded-lg hover:bg-[#F5F3ED] transition-colors text-sm sm:text-base"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
      Configure OpenAI API Key
    </button>
  );
};

export default ApiKeySettings;