import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { chainsStore } from '../create-endpoint/store';

/**
 * This endpoint allows direct creation of chains by bypassing security rules
 * It should only be used in development/testing environments
 */
export async function POST(request: NextRequest) {
  try {
    // Get chain data from request
    const data = await request.json();
    const { chainId, userId, chainData } = data;
    
    if (!chainId || !userId || !chainData) {
      return NextResponse.json(
        { error: 'Missing required fields: chainId, userId, chainData' },
        { status: 400 }
      );
    }
    
    // Try to store directly in Firestore using Admin SDK
    try {
      const ref = adminDb.collection('users').doc(userId).collection('chains').doc(chainId);
      await ref.set(chainData);
      console.log(`Successfully stored chain ${chainId} for user ${userId} using Admin SDK`);
      
      // Also store in memory
      chainsStore[chainId] = chainData;
      
      return NextResponse.json({
        success: true,
        message: 'Chain stored successfully',
        id: chainId
      });
      
    } catch (error: any) {
      console.error('Error storing chain using Admin SDK:', error);
      
      // Store only in memory as fallback
      chainsStore[chainId] = chainData;
      
      return NextResponse.json({
        success: true,
        warning: 'Chain stored in memory only (not in Firestore)',
        error: error.message,
        id: chainId
      });
    }
  } catch (error: any) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: `Failed to store chain: ${error.message}` },
      { status: 500 }
    );
  }
} 