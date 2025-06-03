import { NextResponse } from 'next/server';
import { createChain } from '@/lib/chainUtils';
import { chainsStore } from './store';

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    
    // Get user info from the request body instead of Firebase auth
    const { chainData, apiKey, userInfo } = requestData;
    
    // Check user info
    if (!userInfo || !userInfo.email) {
      return NextResponse.json(
        { error: 'User information required' },
        { status: 401 }
      );
    }
    
    // Validate request data
    if (!chainData || !chainData.steps || chainData.steps.length === 0) {
      return NextResponse.json(
        { error: 'Invalid chain data. Chain must have at least one step.' },
        { status: 400 }
      );
    }

    // Check if API key is provided
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is required' },
        { status: 400 }
      );
    }

    // Get host for URL generation
    const host = request.headers.get('host') || 'localhost:3001';
    
    // Create the chain using our utility function
    console.log("Creating chain with utility function...");
    
    try {
      const chainResult = await createChain(chainData, userInfo, apiKey, host);
      
      console.log(`Created endpoint: ${chainResult.endpointUrl}`);
      console.log(`Stored chain ID: ${chainResult.id}`);
  
      // Check if we got a memory-only warning
      if (chainResult.warning) {
        console.warn("Created memory-only chain due to database errors");
      }
  
      return NextResponse.json({
        id: chainResult.id,
        endpointUrl: chainResult.endpointUrl,
        portNumber: chainResult.portNumber,
        userName: chainResult.userName,
        message: chainResult.warning 
          ? 'Chain endpoint created but only stored in memory (will be lost on server restart)' 
          : 'Chain endpoint created successfully'
      });
    } catch (chainError: any) {
      console.error('Chain creation error:', chainError);
      
      // Create an emergency fallback if the chain utility fails
      const chainId = `emergency-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Generate a simple endpoint URL
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const endpointUrl = `${protocol}://${host}/api/chains/emergency/${userInfo.uid}/${chainId}`;
      
      // Store basic chain data in memory
      const emergencyChainData = {
        userId: userInfo.uid,
        userEmail: userInfo.email,
        chainData: chainData,
        openAiApiKey: apiKey,
        createdAt: new Date().toISOString(),
        endpointUrl: endpointUrl
      };
      
      // Store in memory
      chainsStore[chainId] = emergencyChainData;
      
      return NextResponse.json({
        id: chainId,
        endpointUrl: endpointUrl,
        message: 'Emergency chain endpoint created (memory-only, will be lost on server restart)',
        error: chainError.message
      });
    }
    
  } catch (error: any) {
    console.error('Error creating endpoint:', error);
    return NextResponse.json(
      { error: `Failed to create endpoint: ${error.message}` },
      { status: 500 }
    );
  }
} 