"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { hasApiKey, getApiKey, getModel } from '@/lib/openai';
import ApiKeySettings from '@/components/ApiKeySettings';
import { auth } from '@/lib/firebase';

type ChainStep = {
  id: number;
  inputStatement: string;
  instructions: string;
  requiredOutput: string;
  result: string;
  loading?: boolean;
  error?: string;
};

export default function ChainProcessPage() {
  const [apiKeyAvailable, setApiKeyAvailable] = useState<boolean>(false);
  const [steps, setSteps] = useState<ChainStep[]>([
    {
      id: 1,
      inputStatement: '',
      instructions: '',
      requiredOutput: '',
      result: '',
      loading: false,
      error: ''
    }
  ]);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testResults, setTestResults] = useState<Array<{stepId: number, result: string, error?: string}>>([]);
  const [isTestProcessing, setIsTestProcessing] = useState(false);
  const [showEndpointModal, setShowEndpointModal] = useState(false);
  const [endpointUrl, setEndpointUrl] = useState('');
  const [compilingEndpoint, setCompilingEndpoint] = useState(false);

  // Check if API key is available on mount
  useEffect(() => {
    setApiKeyAvailable(hasApiKey());
  }, []);

  // Handle API key changes
  const handleApiKeySaved = () => {
    setApiKeyAvailable(true);
  };

  // Process the current step and generate a result
  const processStep = async (stepId: number) => {
    if (!apiKeyAvailable) {
      setSteps(prevSteps =>
        prevSteps.map(step =>
          step.id === stepId ? { ...step, error: 'OpenAI API key not set.' } : step
        )
      );
      return;
    }

    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId ? { ...step, loading: true, error: '' } : step
      )
    );
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    try {
      const res = await fetch('/api/chain-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputStatement: step.inputStatement,
          instructions: step.instructions,
          requiredOutput: step.requiredOutput,
          apiKey: getApiKey(),
          model: getModel()
        })
      });
      const data = await res.json();
      setSteps(prevSteps =>
        prevSteps.map(s =>
          s.id === stepId
            ? { ...s, result: data.result || '', loading: false, error: data.error || '' }
            : s
        )
      );
      return data.result || '';
    } catch (err: any) {
      const errorMsg = 'Failed to fetch result.';
      setSteps(prevSteps =>
        prevSteps.map(s =>
          s.id === stepId
            ? { ...s, loading: false, error: errorMsg }
            : s
        )
      );
      return null;
    }
  };

  // Process a step for testing without modifying the actual steps
  const processTestStep = async (stepId: number, input: string) => {
    if (!apiKeyAvailable) {
      return { 
        stepId: stepId,
        result: '',
        error: 'OpenAI API key not set.' 
      };
    }

    const step = steps.find(s => s.id === stepId);
    if (!step) return { 
      stepId: stepId,
      result: '',
      error: 'Step not found' 
    };

    try {
      const res = await fetch('/api/chain-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputStatement: input,
          instructions: step.instructions,
          requiredOutput: step.requiredOutput,
          apiKey: getApiKey(),
          model: getModel()
        })
      });
      const data = await res.json();
      return { 
        stepId: stepId,
        result: data.result || '', 
        error: data.error 
      };
    } catch (err: any) {
      return { 
        stepId: stepId,
        result: '',
        error: 'Failed to fetch result.' 
      };
    }
  };

  // Run a test through all steps with a custom input
  const runTest = async () => {
    if (!testInput.trim() || steps.length === 0 || isTestProcessing) return;
    
    setIsTestProcessing(true);
    setTestResults([]);
    
    const results = [];
    let currentInput = testInput;
    
    for (const step of steps) {
      // Update UI to show processing
      setTestResults(prev => [...prev, { 
        stepId: step.id, 
        result: 'Processing...',
        error: undefined
      }]);
      
      // Process the step
      const result = await processTestStep(step.id, currentInput);
      
      // Update results
      setTestResults(prev => 
        prev.map(r => r.stepId === step.id ? result : r)
      );
      
      // Break the chain if there was an error
      if (result.error) break;
      
      // Use this result as input for the next step
      currentInput = result.result;
    }
    
    setIsTestProcessing(false);
  };

  // Add a new step with the previous result
  const addNewStep = () => {
    const lastStep = steps[steps.length - 1];
    const newId = lastStep.id + 1;
    
    setSteps([
      ...steps,
      {
        id: newId,
        inputStatement: lastStep.result,
        instructions: '',
        requiredOutput: '',
        result: '',
        loading: false,
        error: ''
      }
    ]);
  };

  // Delete a step
  const deleteStep = (id: number) => {
    setSteps(prev => prev.length === 1 ? prev : prev.filter(step => step.id !== id));
  };

  const handleInputChange = (stepId: number, field: keyof ChainStep, value: string) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId ? { ...step, [field]: value } : step
      )
    );
  };

  // Handle compiling chain to an API endpoint
  const handleCompileChain = async () => {
    // Validate chain
    if (steps.length === 0) {
      alert("Cannot compile an empty chain. Please add at least one step.");
      return;
    }

    // Check if any step is incomplete
    const incompleteStep = steps.find(step => 
      !step.inputStatement.trim() || 
      !step.instructions.trim() || 
      !step.requiredOutput.trim()
    );

    if (incompleteStep) {
      alert("Please complete all fields in all steps before compiling.");
      return;
    }

    // Check if API key is available
    if (!apiKeyAvailable) {
      alert("Please configure your OpenAI API key first.");
      return;
    }

    try {
      setCompilingEndpoint(true);
      
      // Get current user info from Firebase auth
      const user = auth.currentUser;
      const userInfo = user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      } : {
        uid: 'anonymous',
        email: 'anonymous@example.com',
        displayName: 'Anonymous User'
      };
      
      // Prepare the chain data
      const chainData = {
        steps: steps.map(step => ({
          id: step.id,
          inputStatement: step.inputStatement,
          instructions: step.instructions,
          requiredOutput: step.requiredOutput
        }))
      };
      
      console.log("Sending request to create endpoint...");
      
      // Make API call to create endpoint
      const response = await fetch('/api/create-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainData,
          apiKey: getApiKey(),
          userInfo
        })
      });
      
      if (!response.ok) {
        // If the standard endpoint fails due to permission issues, try the direct store endpoint
        if (response.status === 403 || response.status === 401) {
          console.log("Permission denied, trying memory-only mode...");
          
          // Generate a unique ID for the chain
          const chainId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
          
          // Create a memory-only version
          const memoryResponse = await fetch('/api/store-chain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chainId,
              userId: userInfo.uid,
              chainData: {
                userId: userInfo.uid,
                userEmail: userInfo.email,
                chainData: chainData,
                openAiApiKey: getApiKey(),
                createdAt: new Date().toISOString(),
                userName: userInfo.displayName || 'anonymous'
              }
            })
          });
          
          if (!memoryResponse.ok) {
            throw new Error("Failed to create chain in both Firestore and memory");
          }
          
          const memoryData = await memoryResponse.json();
          
          // Create the URLs manually
          const host = window.location.host;
          const protocol = window.location.protocol;
          const simplifiedApiUrl = `${protocol}//${host}/api/process/${chainId}`;
          
          setEndpointUrl('Memory only - not persistent');
          
          alert("Created memory-only chain due to Firebase permission issues. The chain will be lost when the server restarts.");
          
          // Skip rest of normal flow
          setShowEndpointModal(true);
          setCompilingEndpoint(false);
          return;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create API endpoint');
      }
      
      const data = await response.json();
      setEndpointUrl(data.endpointUrl);
      
      // Save chain data as JSON file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `chain-${timestamp}.json`;
      const fullChainData = {
        chainId: data.id,
        endpointUrl: data.endpointUrl,
        createdAt: new Date().toISOString(),
        userInfo: {
          email: userInfo.email,
          displayName: userInfo.displayName
        },
        chain: chainData
      };
      
      const jsonBlob = new Blob([JSON.stringify(fullChainData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(jsonBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setShowEndpointModal(true);
    } catch (error: any) {
      console.error('Failed to compile chain:', error);
      alert(error.message || 'Failed to create API endpoint. Please try again.');
    } finally {
      setCompilingEndpoint(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-[#382A22] mb-3">
          <span className="gradient-text">Chain Process</span>
        </h1>
        <p className="text-[#7D5F4A] text-center max-w-2xl mx-auto">Design your own chain process by adding one or more steps. Each step can use the previous result as input.</p>
      </div>
      
      {!apiKeyAvailable && (
        <div className="mb-8 p-4 border border-[#D6D1C2] bg-[#F5F3ED] text-[#7D5F4A] rounded-lg shadow-sm">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#8A6A52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-medium text-[#47352B]">OpenAI API Key Required</h3>
          </div>
          <p className="mt-2 text-sm">Please configure your OpenAI API key below before using chain process features.</p>
        </div>
      )}
      
      <div className="flex justify-center mb-8">
        <ApiKeySettings onSave={handleApiKeySaved} />
      </div>

      <div className="flex flex-wrap justify-center gap-3 mb-8">
        <button
          onClick={() => {
            if (!apiKeyAvailable) {
              alert("Please configure your OpenAI API key first.");
              return;
            }
            
            const configData = JSON.stringify(steps, null, 2);
            const blob = new Blob([configData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'chain-process-config.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D6D1C2] text-[#47352B] rounded-lg hover:bg-[#F5F3ED] shadow-sm transition-colors"
          disabled={!apiKeyAvailable}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Save Chain
        </button>
        
        <label className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D6D1C2] text-[#47352B] rounded-lg hover:bg-[#F5F3ED] shadow-sm cursor-pointer transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload Chain
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              if (!apiKeyAvailable) {
                alert("Please configure your OpenAI API key first.");
                return;
              }
              
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const config = JSON.parse(event.target?.result as string);
                    if (Array.isArray(config) && config.length > 0) {
                      const stepsWithNewIds = config.map((step, index) => ({
                        ...step,
                        id: Date.now() + index
                      }));
                      setSteps(stepsWithNewIds);
                    }
                  } catch (error) {
                    alert('Invalid configuration file');
                  }
                };
                reader.readAsText(file);
              }
              e.target.value = '';
            }}
          />
        </label>

        <button
          onClick={handleCompileChain}
          disabled={compilingEndpoint || !apiKeyAvailable}
          className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-lg shadow-md text-sm font-medium text-white gradient-bg hover:opacity-90 transition-colors disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          {compilingEndpoint ? 'Compiling...' : 'Compile'}
        </button>

        <button
          onClick={() => {
            if (!apiKeyAvailable) {
              alert("Please configure your OpenAI API key first.");
              return;
            }
            setShowTestModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#D6D1C2] text-[#47352B] rounded-lg hover:bg-[#F5F3ED] shadow-sm transition-colors"
          disabled={steps.length === 0 || !apiKeyAvailable}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Test
        </button>
      </div>
      
      {steps.map((step, idx) => (
        <div
          key={step.id}
          className="relative bg-white border border-[#D6D1C2] rounded-lg shadow-md p-5 mb-6"
        >
          {/* Step Number */}
          <div className="absolute -left-3 -top-3">
            <div className="w-6 h-6 rounded-full bg-[#E0DCD0] text-[#47352B] flex items-center justify-center font-medium text-sm border border-[#D6D1C2] shadow-sm">
              {idx + 1}
            </div>
          </div>
          {/* Delete Button */}
          {steps.length > 1 && (
            <button
              onClick={() => deleteStep(step.id)}
              className="absolute top-3 right-3 text-[#8A6A52] hover:text-[#624A3B] p-1 rounded-full hover:bg-[#F5F3ED] transition-colors"
              title="Delete this step"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
          <h2 className="text-md font-medium mb-4 text-[#624A3B] pl-4">Step {idx + 1}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#624A3B] mb-1">Input Statement</label>
              <textarea
                className="w-full p-2 border border-[#B09780] rounded-md focus:ring-2 focus:ring-[#D4A77C] focus:border-[#BE8A60] min-h-[80px] text-[#382A22] bg-[#F5F3ED]"
                value={step.inputStatement}
                onChange={e => handleInputChange(step.id, 'inputStatement', e.target.value)}
                placeholder="Enter your input statement here"
                disabled={step.loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#624A3B] mb-1">Instructions</label>
              <textarea
                className="w-full p-2 border border-[#B09780] rounded-md focus:ring-2 focus:ring-[#D4A77C] focus:border-[#BE8A60] min-h-[80px] text-[#382A22] bg-[#F5F3ED]"
                value={step.instructions}
                onChange={e => handleInputChange(step.id, 'instructions', e.target.value)}
                placeholder="Enter processing instructions"
                disabled={step.loading}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#624A3B] mb-1">Required Output</label>
              <textarea
                className="w-full p-2 border border-[#B09780] rounded-md focus:ring-2 focus:ring-[#D4A77C] focus:border-[#BE8A60] min-h-[80px] text-[#382A22] bg-[#F5F3ED]"
                value={step.requiredOutput}
                onChange={e => handleInputChange(step.id, 'requiredOutput', e.target.value)}
                placeholder="Describe the required output"
                disabled={step.loading}
              />
            </div>
          </div>
          {/* Process Button or Result */}
          {!step.result ? (
            <button
              onClick={() => {
                if (!apiKeyAvailable) {
                  alert("Please configure your OpenAI API key first.");
                  return;
                }
                processStep(step.id);
              }}
              className="mt-4 gradient-bg text-white py-2 px-5 rounded-md hover:opacity-90 shadow-md transition-colors disabled:opacity-50"
              disabled={step.loading || !apiKeyAvailable}
            >
              {step.loading ? 'Processing...' : 'Process'}
            </button>
          ) : (
            <div className="mt-4 bg-[#F5F3ED] border border-[#D6D1C2] rounded-md p-4">
              <div className="text-xs text-[#8A6A52] mb-1">Result</div>
              <pre className="whitespace-pre-wrap text-[#382A22] text-sm overflow-auto max-h-60 bg-white p-3 border border-[#E0DCD0] rounded">{step.result}</pre>
            </div>
          )}
          {step.error && (
            <div className="mt-2 text-red-600 text-sm bg-red-50 p-2 rounded border border-red-100">
              Error: {step.error}
            </div>
          )}
        </div>
      ))}
      
      <div className="flex justify-center mb-10">
        <button
          onClick={addNewStep}
          disabled={!steps[steps.length - 1].result}
          className="flex items-center gap-2 px-4 py-2 border border-[#D6D1C2] text-[#705443] rounded-md font-medium bg-white hover:bg-[#F5F3ED] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/></svg>
          Add Next Step
        </button>
      </div>

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-[#382A22] bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#382A22]">Test Chain</h2>
              <button 
                onClick={() => {
                  setShowTestModal(false);
                  setTestResults([]);
                }}
                className="text-[#8A6A52] hover:text-[#624A3B] p-1 rounded hover:bg-[#F5F3ED] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {!apiKeyAvailable && (
              <div className="mb-4 p-3 bg-[#F5F3ED] border border-[#D6D1C2] rounded-md text-[#705443]">
                <div className="font-medium">API Key Required</div>
                <p className="text-sm">Please configure your OpenAI API key before testing.</p>
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#47352B] mb-1">Input Statement</label>
              <textarea
                className="w-full p-3 border border-[#B09780] rounded-md focus:ring-2 focus:ring-[#D4A77C] focus:border-[#BE8A60] min-h-[100px] text-[#382A22] bg-[#F5F3ED]"
                value={testInput}
                onChange={e => setTestInput(e.target.value)}
                placeholder="Enter your test input here"
                disabled={isTestProcessing || !apiKeyAvailable}
              />
            </div>
            
            <button
              onClick={() => {
                if (!apiKeyAvailable) {
                  alert("Please configure your OpenAI API key first.");
                  return;
                }
                runTest();
              }}
              className="w-full mb-4 gradient-bg text-white py-2 px-6 rounded-md hover:opacity-90 shadow-sm transition-colors disabled:opacity-50"
              disabled={isTestProcessing || !testInput.trim() || !apiKeyAvailable}
            >
              {isTestProcessing ? 'Processing...' : 'Start Test'}
            </button>
            
            {testResults.length > 0 && (
              <div className="border-t border-[#D6D1C2] pt-4 mt-2">
                <h3 className="font-medium mb-3 text-[#47352B]">Results:</h3>
                <div className="space-y-3">
                  {testResults.map((result, index) => {
                    return (
                      <div key={result.stepId} className="border border-[#D6D1C2] rounded-md p-3 bg-[#F5F3ED]">
                        <div className="text-sm font-medium text-[#47352B] mb-1">Step {index + 1}</div>
                        {result.error ? (
                          <div className="text-red-600 text-sm mt-1 bg-red-50 p-2 rounded border border-red-100">
                            {result.error}
                          </div>
                        ) : (
                          <pre className="text-sm mt-1 whitespace-pre-wrap overflow-auto max-h-60 bg-white p-3 border border-[#E0DCD0] rounded text-[#382A22]">
                            {result.result}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Endpoint Modal */}
      {showEndpointModal && (
        <div className="fixed inset-0 bg-[#382A22] bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#382A22]">API Endpoint Created</h2>
              <button 
                onClick={() => setShowEndpointModal(false)}
                className="text-[#8A6A52] hover:text-[#624A3B] p-1 rounded hover:bg-[#F5F3ED] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="mb-4 text-[#47352B] text-sm">
              Your chain process has been compiled into the following API endpoint:
            </p>
            
            <div className="mb-6">
              <h3 className="font-medium text-[#382A22] mb-2 text-sm">API Endpoint URL:</h3>
              <div className="bg-[#F5F3ED] p-3 rounded-md mb-2 break-all">
                <code className="text-sm font-mono text-[#382A22]">{endpointUrl}</code>
              </div>
              {endpointUrl && endpointUrl.includes('memory-only') && (
                <div className="text-amber-600 text-xs mt-1 bg-amber-50 p-2 rounded border border-amber-100">
                  ⚠️ This is a memory-only endpoint. It will not persist after server restart.
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-[#382A22] mb-2 text-sm">How to use:</h3>
              <ol className="list-decimal list-inside text-sm text-[#47352B] space-y-2">
                <li className="pl-1">Send a POST request to the endpoint</li>
                <li className="pl-1">Include your input in the request body as JSON: <code className="bg-[#F5F3ED] px-2 py-1 rounded text-sm">{"{ \"input\": \"your text here\" }"}</code></li>
                <li className="pl-1">The API will process your input through the entire chain</li>
                <li className="pl-1">You'll receive the results in the response</li>
              </ol>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(endpointUrl);
                  alert('API endpoint URL copied to clipboard!');
                }}
                className="flex items-center gap-2 px-4 py-2 gradient-bg text-white rounded-md hover:opacity-90 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy API URL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 