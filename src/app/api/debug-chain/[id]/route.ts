import { NextRequest, NextResponse } from 'next/server';
import { chainsStore } from '../../create-endpoint/store';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, DocumentData } from 'firebase/firestore';
import { getChainById } from '@/lib/chainUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Check if chain exists in memory
    const inMemory = !!chainsStore[id];
    
    // Try to get the chain data using our utility
    const chainData = await getChainById(id);
    
    // Initialize Firestore check
    let inFirestore = false;
    let userOwner: string | null = null;
    let firestoreData: DocumentData | null = null;
    
    // Check Firestore manually for debug purposes
    try {
      // Get all users
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      
      // Loop through users to find the chain
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        
        // Check if the chain exists in this user's collection
        const chainDocRef = doc(db, 'users', userId, 'chains', id);
        const chainDocSnap = await getDoc(chainDocRef);
        
        if (chainDocSnap.exists()) {
          inFirestore = true;
          userOwner = userId;
          firestoreData = chainDocSnap.data();
          break;
        }
      }
    } catch (firestoreError) {
      console.error('Error checking Firestore:', firestoreError);
    }
    
    // Return debug information
    return NextResponse.json({
      chainId: id,
      existsInMemory: inMemory,
      existsInFirestore: inFirestore,
      foundByUtility: !!chainData,
      userOwner: userOwner,
      memoryKeys: inMemory ? Object.keys(chainsStore[id]) : null,
      firestoreKeys: firestoreData ? Object.keys(firestoreData) : null,
      memoryStore: Object.keys(chainsStore),
      hasApiKey: inFirestore && firestoreData ? !!firestoreData.openAiApiKey : (inMemory ? !!chainsStore[id].openAiApiKey : false),
      completeFirestoreData: firestoreData
    });
    
  } catch (error: any) {
    console.error('Error retrieving chain debug info:', error);
    return NextResponse.json(
      { error: `Failed to debug chain: ${error.message}` },
      { status: 500 }
    );
  }
} 