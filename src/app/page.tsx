"use client";

import { useEffect } from 'react';
import { auth } from '@/lib/firebase';

export default function Home() {
  useEffect(() => {
    // Immediately redirect to login page
    // No conditional checks to avoid loops
    window.location.href = '/login';
    
    // We won't even check auth state here to avoid potential loops
    // Auth checks will be done in protected layouts
  }, []);

  // Show minimal loading spinner
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );
}
