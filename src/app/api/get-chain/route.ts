import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    // Get the chain ID from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const chainId = searchParams.get('chainId');
    
    if (!chainId) {
      return NextResponse.json(
        { error: 'Chain ID is required' },
        { status: 400 }
      );
    }
    
    // Initialize result
    let chainData = null;
    
    // Get all user IDs from the 'users' collection
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    
    // Iterate through each user
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      // Try to find the chain in this user's chains collection
      const userChainsCollection = collection(db, 'users', userId, 'chains');
      const chainQuery = query(userChainsCollection);
      const chainsSnapshot = await getDocs(chainQuery);
      
      // Search for the chain with matching ID
      for (const chainDoc of chainsSnapshot.docs) {
        if (chainDoc.id === chainId) {
          chainData = chainDoc.data();
          break;
        }
      }
      
      // If we found the chain, stop searching
      if (chainData) break;
    }
    
    if (!chainData) {
      return NextResponse.json(
        { error: 'Chain not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      chain: chainData
    });
    
  } catch (error: any) {
    console.error('Error retrieving chain from Firestore:', error);
    return NextResponse.json(
      { error: `Failed to retrieve chain: ${error.message}` },
      { status: 500 }
    );
  }
} 