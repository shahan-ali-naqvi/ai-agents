import { NextRequest } from 'next/server';
import { auth } from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// Ensure Firebase Admin is initialized
import './firebase-admin';

/**
 * Helper function to get Firebase user from request
 * Uses the Firebase ID token from the Authorization header
 */
export async function getFirebaseUser(req: NextRequest) {
  try {
    // Check if Firebase Admin is initialized
    if (getApps().length === 0) {
      console.error('Firebase Admin not initialized');
      return null;
    }

    // Get Authorization header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Try to get the token from a cookie
      const firebaseToken = req.cookies.get('firebaseIdToken')?.value;
      if (!firebaseToken) {
        return null;
      }
      
      // Verify the Firebase ID token
      const decodedToken = await auth().verifyIdToken(firebaseToken);
      return decodedToken;
    }
    
    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return null;
    }
    
    // Verify the Firebase ID token
    const decodedToken = await auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return null;
  }
} 