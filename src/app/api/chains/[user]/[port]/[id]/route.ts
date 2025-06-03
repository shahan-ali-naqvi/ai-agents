import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getChainById } from '@/lib/chainUtils';

// Import chainsStore from the create-endpoint route
// In a real app, this would be a database, but for this demo we'll share memory
import { chainsStore } from '../../../../create-endpoint/store';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

// Add GET method to display chain data
export async function GET(
  request: NextRequest,
  { params }: { params: { user: string; port: string; id: string } }
) {
  try {
    // Always await params in Next.js dynamic API routes
    const id = await params.id;
    
    console.log(`Looking for chain with ID: ${id}`);
    
    // Get chain data using the utility function
    const chainData = await getChainById(id);
    
    if (!chainData) {
      console.log('Chain not found in memory or Firestore');
      return NextResponse.json(
        { error: 'Chain not found. It may have expired or been deleted.' },
        { status: 404 }
      );
    }
    
    // Return the chain data as JSON
    return NextResponse.json({
      success: true,
      chain: chainData,
      message: 'Chain data retrieved successfully',
      usage: {
        endpoint: 'POST to this URL with {"input": "your text"} to process through the chain'
      }
    });
    
  } catch (error: any) {
    console.error('Error retrieving chain:', error);
    return NextResponse.json(
      { error: `Failed to retrieve chain: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { user: string; port: string; id: string } }
) {
  try {
    // Always await params in Next.js dynamic API routes
    const id = await params.id;
    
    console.log(`Processing chain with ID: ${id}`);
    
    // Get chain data using the utility function
    const chainData = await getChainById(id);
    
    if (!chainData) {
      console.log('Chain not found in memory or Firestore');
      return NextResponse.json(
        { error: 'Chain not found. It may have expired or been deleted.' },
        { status: 404 }
      );
    }
    
    // Check if the chain has an API key
    if (!chainData.openAiApiKey) {
      return NextResponse.json(
        { error: 'API key not found for this chain. The chain may be corrupted.' },
        { status: 400 }
      );
    }
    
    // Get input from request body
    const body = await request.json();
    if (!body.input) {
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      );
    }
    
    // Process input through chain steps
    const steps = chainData.chainData.steps;
    let currentInput = body.input;
    const results = [];
    
    for (const step of steps) {
      try {
        // Process through OpenAI using the chain's API key
        const result = await processStep(
          currentInput,
          step.instructions,
          step.requiredOutput,
          chainData.openAiApiKey
        );
        
        results.push({
          stepId: step.id,
          input: currentInput,
          result
        });
        
        // Use this result as input for next step
        currentInput = result;
      } catch (error: any) {
        return NextResponse.json(
          { 
            error: `Error processing step ${step.id}: ${error.message}`,
            partialResults: results
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      results,
      finalResult: currentInput
    });
    
  } catch (error: any) {
    console.error('Error processing chain:', error);
    return NextResponse.json(
      { error: `Failed to process chain: ${error.message}` },
      { status: 500 }
    );
  }
}

// Process step with OpenAI
async function processStep(
  input: string,
  instructions: string,
  requiredOutput: string,
  apiKey: string
): Promise<string> {
  try {
    // Initialize OpenAI client with the chain's API key
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Create system message with instructions and required output format
    const systemMessage = `
      Instructions: ${instructions}
      
      Required output format: ${requiredOutput}
      
      Process the user input according to these instructions and return a result in the required format.
    `;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // or other appropriate model
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: input }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Return the generated text
    return response.choices[0]?.message?.content || 
      "Error: No response generated";
      
  } catch (error: any) {
    console.error("Error calling OpenAI API:", error);
    // Throw error to be handled by the caller
    throw new Error(`OpenAI API error: ${error.message}`);
  }
} 