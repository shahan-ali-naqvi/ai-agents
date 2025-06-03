import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getChainById } from '@/lib/chainUtils';
import { collection, query, where, getDocs, limit, DocumentData } from 'firebase/firestore';
import OpenAI from 'openai';

/**
 * This endpoint allows direct access to chains using just a short segment of the ID
 * For example: /api/chain-direct/abcd123 instead of /api/process/1684389275814-abcd123
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    if (!slug || slug.length < 4) {
      return NextResponse.json(
        { error: 'Slug must be at least 4 characters long' },
        { status: 400 }
      );
    }
    
    console.log(`Looking for chains containing slug: ${slug}`);
    
    // Get all users
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    
    // Search for chains containing the slug in their ID
    let foundChainId: string | null = null;
    let foundChainData: DocumentData | null = null;
    
    // Loop through users to find the chain
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`Checking user: ${userId} for chains matching "${slug}"`);
      
      // Get all chains for this user
      const chainsCollection = collection(db, 'users', userId, 'chains');
      const chainsSnapshot = await getDocs(chainsCollection);
      
      // Check each chain's ID
      for (const chainDoc of chainsSnapshot.docs) {
        if (chainDoc.id.includes(slug)) {
          foundChainId = chainDoc.id;
          foundChainData = chainDoc.data();
          console.log(`Found matching chain: ${foundChainId}`);
          break;
        }
      }
      
      if (foundChainId) break;
    }
    
    if (!foundChainId || !foundChainData) {
      return NextResponse.json(
        { error: 'No chains found matching this slug' },
        { status: 404 }
      );
    }
    
    // Redirect to the full chain endpoint or the simplified process endpoint
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    
    // Create redirect URLs
    const fullEndpoint = `${protocol}://${host}/api/chains/${foundChainData.userName}/${foundChainData.portNumber}/${foundChainId}`;
    const simpleEndpoint = `${protocol}://${host}/api/process/${foundChainId}`;
    
    return NextResponse.json({
      success: true,
      chainId: foundChainId,
      fullEndpoint,
      simpleEndpoint,
      userPrompt: `Use the simplified endpoint for quick processing: POST to ${simpleEndpoint} with {"input": "your text"}`
    });
    
  } catch (error: any) {
    console.error('Error finding chain by slug:', error);
    return NextResponse.json(
      { error: `Failed to find chain: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * POST method to directly process input through a chain found by slug
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    if (!slug || slug.length < 4) {
      return NextResponse.json(
        { error: 'Slug must be at least 4 characters long' },
        { status: 400 }
      );
    }
    
    // Get request body
    const body = await request.json();
    if (!body.input) {
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      );
    }
    
    console.log(`Looking for chains containing slug: ${slug}`);
    
    // Get all users
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    
    // Search for chains containing the slug in their ID
    let foundChainId: string | null = null;
    
    // Loop through users to find the chain
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      // Get all chains for this user
      const chainsCollection = collection(db, 'users', userId, 'chains');
      const chainsSnapshot = await getDocs(chainsCollection);
      
      // Check each chain's ID
      for (const chainDoc of chainsSnapshot.docs) {
        if (chainDoc.id.includes(slug)) {
          foundChainId = chainDoc.id;
          console.log(`Found matching chain: ${foundChainId}`);
          break;
        }
      }
      
      if (foundChainId) break;
    }
    
    if (!foundChainId) {
      return NextResponse.json(
        { error: 'No chains found matching this slug' },
        { status: 404 }
      );
    }
    
    // Get the full chain data
    const chainData = await getChainById(foundChainId);
    
    if (!chainData) {
      return NextResponse.json(
        { error: 'Chain data could not be retrieved' },
        { status: 500 }
      );
    }
    
    // Check if the chain has an API key
    if (!chainData.openAiApiKey) {
      return NextResponse.json(
        { error: 'API key not found for this chain. The chain may be corrupted.' },
        { status: 400 }
      );
    }
    
    // Forward request to the process endpoint logic
    // Process input through chain steps
    const steps = chainData.chainData.steps;
    let currentInput = body.input;
    const stepResults = [];
    
    for (const step of steps) {
      try {
        // Process through OpenAI using the chain's API key
        const openaiInstance = new OpenAI({
          apiKey: chainData.openAiApiKey,
        });
        
        const systemMessage = `
          Instructions: ${step.instructions}
          
          Required output format: ${step.requiredOutput}
          
          Process the user input according to these instructions and return a result in the required format.
        `;
        
        const response = await openaiInstance.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: currentInput }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });
        
        const result = response.choices[0]?.message?.content || "Error: No response generated";
        
        stepResults.push({
          stepId: step.id,
          stepInstructions: step.instructions,
          input: currentInput,
          result: result
        });
        
        // Use this result as input for next step
        currentInput = result;
      } catch (error: any) {
        return NextResponse.json(
          { 
            error: `Error processing input: ${error.message}`,
            partialResults: stepResults
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      chainId: foundChainId,
      finalResult: currentInput,
      steps: stepResults,
      stepResults: stepResults.map(step => step.result)
    });
    
  } catch (error: any) {
    console.error('Error processing chain by slug:', error);
    return NextResponse.json(
      { error: `Failed to process: ${error.message}` },
      { status: 500 }
    );
  }
} 