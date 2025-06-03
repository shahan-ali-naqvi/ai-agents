"use client";

import { useEffect, useState } from 'react';
import Navbar from "@/components/Navbar";
import { useAuth } from "@/providers/AuthProvider";

export default function PortsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuth();
  const [isClient, setIsClient] = useState(false);
  
  // Only run on client side
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Check if user is authenticated
  useEffect(() => {
    if (isClient && !loading && !user) {
      console.log("Not authenticated in protected layout, redirecting to login");
      // Use direct window.location for hard redirect
      window.location.href = '/login';
    }
  }, [user, loading, isClient]);
  
  // Show loading while checking auth
  if (loading || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  // If we get here, user is authenticated
  return (
    <>
      <Navbar />
      {children}
    </>
  );
} 