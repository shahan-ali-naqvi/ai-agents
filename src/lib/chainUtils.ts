import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, DocumentData, setDoc } from 'firebase/firestore';
import { chainsStore } from '@/app/api/create-endpoint/store';
import { getRandomPort } from './utils';
import { createChainWithAdmin } from './firebase-admin';

/**
 * Get chain data by ID from Firestore
 * @param id The chain ID
 * @returns The chain data or null if not found
 */
export async function getChainById(id: string): Promise<DocumentData | null> {
  console.log(`[Utils] Looking for chain with ID: ${id}`);
  
  // First check the in-memory store
  let chainData = chainsStore[id];
  
  if (chainData) {
    console.log('[Utils] Chain found in memory cache');
    return chainData;
  }
  
  console.log('[Utils] Chain not in memory, checking Firestore...');
  
  try {
    // Get all users
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    
    // Loop through users to find the chain
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`[Utils] Checking user: ${userId} for chain: ${id}`);
      
      // Check if the chain exists in this user's collection
      const chainDocRef = doc(db, 'users', userId, 'chains', id);
      const chainDocSnap = await getDoc(chainDocRef);
      
      if (chainDocSnap.exists()) {
        chainData = chainDocSnap.data();
        console.log(`[Utils] Found chain in Firestore under user: ${userId}`);
        
        // Update the memory cache
        chainsStore[id] = chainData;
        
        return chainData;
      }
    }
    
    console.log('[Utils] Chain not found in any user collection');
    return null;
  } catch (error) {
    console.error('[Utils] Error retrieving chain:', error);
    // Check if there's a fallback memory-only chain available
    if (chainsStore[id]) {
      console.log('[Utils] Using memory-only fallback for chain');
      return chainsStore[id];
    }
    return null;
  }
}

/**
 * Create a new chain with the provided data
 * @param chainData The chain data to create
 * @param userInfo User information
 * @param apiKey OpenAI API key to use with this chain
 * @param host Server host (including protocol)
 * @returns The created chain data with URLs
 */
export async function createChain(
  chainData: any, 
  userInfo: { uid: string; email: string | null; displayName: string | null; },
  apiKey: string,
  host: string
): Promise<DocumentData> {
  // Generate a unique ID for the chain
  const chainId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  
  // Get a random port number between 3001-9000
  const portNumber = getRandomPort(3001, 9000);
  
  // Use sanitized user name for URL (or email username part)
  const userName = userInfo.displayName || userInfo.email?.split('@')[0] || 'user';
  const safeUserName = userName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  // Generate endpoint URL
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const endpointUrl = `${protocol}://${host}/api/chains/${safeUserName}/${portNumber}/${chainId}`;
  
  // Store chain data with the API key
  const chainDocData = {
    userId: userInfo.uid || 'anonymous',
    userEmail: userInfo.email,
    chainData: chainData,
    openAiApiKey: apiKey, // Store the API key with the chain data
    createdAt: new Date().toISOString(),
    endpointUrl: endpointUrl,
    portNumber: portNumber,
    userName: safeUserName
  };
  
  try {
    // Try to save using client SDK first
    try {
      // Create a reference to the chains collection for this user
      const userChainsRef = collection(db, 'users', userInfo.uid, 'chains');
      
      // Save the chain data to Firestore
      await setDoc(doc(userChainsRef, chainId), chainDocData);
      
      console.log(`[Utils] Saved chain to Firestore: users/${userInfo.uid}/chains/${chainId}`);
    } catch (clientError) {
      console.error('[Utils] Error saving with client SDK, trying admin SDK:', clientError);
      
      // If client SDK fails, try admin SDK
      const adminSaveResult = await createChainWithAdmin(userInfo.uid, chainId, chainDocData);
      
      if (!adminSaveResult) {
        throw new Error('Failed to save chain with both client and admin SDK');
      }
      
      console.log('[Utils] Successfully saved chain with admin SDK');
    }
    
    // Store in local memory for immediate access
    chainsStore[chainId] = chainDocData;
    
    return {
      ...chainDocData,
      id: chainId
    };
  } catch (error) {
    console.error('[Utils] Error saving chain:', error);
    
    // Create a local-only version as a last resort
    console.log('[Utils] Creating memory-only version of the chain');
    chainsStore[chainId] = chainDocData;
    
    return {
      ...chainDocData,
      id: chainId,
      warning: "This chain is only stored in memory and will be lost when the server restarts"
    };
  }
} 