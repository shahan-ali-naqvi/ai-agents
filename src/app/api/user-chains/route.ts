import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from the request body
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Get all chains for this user
    const userChainsCollection = collection(db, 'users', userId, 'chains');
    const chainQuery = query(userChainsCollection, orderBy('createdAt', 'desc'));
    const chainsSnapshot = await getDocs(chainQuery);
    
    // Convert the snapshot to an array of chain data
    const chains = chainsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({
      success: true,
      chains: chains
    });
    
  } catch (error: any) {
    console.error('Error retrieving user chains from Firestore:', error);
    return NextResponse.json(
      { error: `Failed to retrieve chains: ${error.message}` },
      { status: 500 }
    );
  }
} 