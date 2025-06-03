// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth, browserPopupRedirectResolver, browserLocalPersistence, inMemoryPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLVs1e5s97-yzE6hta0PLqRcyE6JNeASA",
  authDomain: "agentai-70479.firebaseapp.com",
  projectId: "agentai-70479",
  storageBucket: "agentai-70479.firebasestorage.app",
  messagingSenderId: "353387419808",
  appId: "1:353387419808:web:13b2df276e154f7c0e51c5",
  measurementId: "G-HDRPV6FCSR"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// Configure auth for better cross-origin compatibility and persistence
const isBrowser = typeof window !== "undefined";
if (isBrowser) {
  // Use browser-specific settings for auth
  auth.useDeviceLanguage();
  
  // Set persistence to avoid session issues
  auth.setPersistence(browserLocalPersistence)
    .catch((error) => {
      console.error("Auth persistence error:", error);
    });
}

const db = getFirestore(app);

export { app, auth, db, browserPopupRedirectResolver }; 