import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if it hasn't been initialized yet
const apps = getApps();

if (!apps.length) {
  try {
    // Try to initialize with environment variables first
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    
    // Private key handling - needs careful parsing of the environment variable
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // Handle different formats that might be stored in the environment variable
    if (privateKey) {
      // Replace escaped newlines with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
      
      // Remove any quotes that might be wrapping the key
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
    }
    
    // If all environment variables are available, use them
    if (projectId && clientEmail && privateKey) {
      try {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey
          })
        });
        console.log('Firebase Admin initialized with environment variables');
      } catch (certError) {
        console.error('Certificate creation error:', certError);
        throw certError;
      }
    } else {
      // Log missing variables
      console.warn('Missing Firebase Admin credentials:', {
        projectId: !!projectId,
        clientEmail: !!clientEmail,
        privateKey: !!privateKey
      });
      
      // Fallback to credential file if available
      initializeApp();
      console.log('Firebase Admin initialized with default credentials');
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    
    // Initialize with a minimal configuration to avoid crashes
    // This won't actually connect to Firebase but prevents code from breaking
    console.log('Initializing Firebase Admin with a minimal configuration');
    initializeApp({
      projectId: 'placeholder-project',
    });
  }
}

// Get Firestore instance
export const db = getFirestore();
export const adminDb = db; // Keep for backwards compatibility

// Helper function to create a chain document directly with admin privileges
export async function createChainWithAdmin(userId: string, chainId: string, chainData: any) {
  try {
    const ref = db.collection('users').doc(userId).collection('chains').doc(chainId);
    await ref.set(chainData);
    return true;
  } catch (error) {
    console.error('Error creating chain with admin:', error);
    return false;
  }
} 