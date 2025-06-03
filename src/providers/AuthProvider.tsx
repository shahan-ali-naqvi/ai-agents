"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  AuthError 
} from 'firebase/auth';
import { auth, browserPopupRedirectResolver } from '@/lib/firebase';
import { usePathname } from 'next/navigation';

// Define auth context types
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<User | null>;
  signInWithGoogle: () => Promise<User | null>;
  signUpWithEmail: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to handle Firebase Auth errors
const handleAuthError = (error: AuthError): string => {
  const errorCode = error.code;
  
  switch(errorCode) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing the process.';
    case 'auth/invalid-email':
      return 'The email address is not valid.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'This email is already in use. Please try a different one.';
    case 'auth/weak-password':
      return 'The password is too weak. Please use a stronger password.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful login attempts. Please try again later.';
    case 'auth/invalid-credential':
      return 'The provided credentials are invalid or expired.';
    case 'auth/operation-not-allowed':
      return 'This operation is not allowed. Please contact support.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email address but different sign-in credentials.';
    default:
      console.error('Auth error:', error);
      return 'An authentication error occurred. Please try again.';
  }
};

// Function to set a cookie for auth state
const setAuthCookie = (isLoggedIn: boolean) => {
  // Set a cookie for our middleware to detect auth state
  // This helps with server-side redirects
  if (isLoggedIn) {
    document.cookie = `localAuth=true; path=/; max-age=86400`; // 24 hours
  } else {
    document.cookie = `localAuth=; path=/; max-age=0`; // Delete cookie
  }
};

// Auth Provider component
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  // Check if there's a redirect result
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        // Check for redirects from Google sign-in
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("Redirect sign-in successful");
          // Set auth cookie
          setAuthCookie(true);
          // Redirect to dashboard after successful redirect sign-in
          window.location.href = '/chain';
        }
      } catch (error) {
        console.error('Redirect sign-in error:', error);
      }
    };
    
    handleRedirectResult();
  }, []);

  // Listen for auth state changes and handle redirects
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      console.log("Auth state changed:", authUser ? "logged in" : "logged out");
      setUser(authUser);
      setLoading(false);
      
      // Update cookie for middleware
      setAuthCookie(!!authUser);
      
      // Redirect logic based on auth state and current path
      if (authUser) {
        // If user is authenticated and on login or signup page, redirect to dashboard
        if (pathname === '/login' || pathname === '/signup') {
          console.log("User is logged in and on auth page, redirecting to dashboard");
          window.location.href = '/chain';
        }
      }
    });

    return () => unsubscribe();
  }, [pathname]);

  // Sign in with email/password
  const signInWithEmail = async (email: string, password: string): Promise<User | null> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Set auth cookie
      setAuthCookie(true);
      // Add immediate redirect for better user experience
      window.location.href = '/chain';
      return result.user;
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(handleAuthError(authError));
    }
  };

  // Sign in with Google
  const signInWithGoogle = async (): Promise<User | null> => {
    try {
      // Create a new GoogleAuthProvider instance each time
      const googleProvider = new GoogleAuthProvider();
      
      // Add scopes
      googleProvider.addScope('profile');
      googleProvider.addScope('email');
      
      try {
        // First try with popup (more user-friendly)
        console.log("Attempting Google sign-in with popup");
        const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
        console.log("Popup sign-in successful");
        // Set auth cookie
        setAuthCookie(true);
        // Add immediate redirect for better user experience
        window.location.href = '/chain';
        return result.user;
      } catch (popupError) {
        console.error('Popup sign-in failed, falling back to redirect:', popupError);
        // If popup fails due to browser restrictions, fall back to redirect
        if ((popupError as AuthError).code.includes('popup')) {
          console.log("Using redirect method instead");
          await signInWithRedirect(auth, googleProvider);
          // The redirect will take the user away from the page
          return null;
        } else {
          // If it's another type of error, rethrow
          throw popupError;
        }
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // If it's a popup-closed-by-user error, return null instead of throwing
      if ((error as AuthError).code === 'auth/popup-closed-by-user') {
        console.log('User closed the popup window');
        return null;
      }
      
      const authError = error as AuthError;
      throw new Error(handleAuthError(authError));
    }
  };

  // Sign up with email/password
  const signUpWithEmail = async (email: string, password: string): Promise<User | null> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(handleAuthError(authError));
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      // Clear auth cookie
      setAuthCookie(false);
      // Force redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to log out. Please try again.');
    }
  };

  // Auth context value
  const value = {
    user,
    loading,
    signInWithEmail,
    signInWithGoogle,
    signUpWithEmail,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 