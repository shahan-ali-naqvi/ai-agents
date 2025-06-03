"use client";

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';

function SignupForm() {
  const router = useRouter();
  const { signUpWithEmail } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill out all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create user with Firebase Auth
      const user = await signUpWithEmail(email, password);
      
      if (user) {
        // Skip Firestore for now if it's causing issues
        console.log("User created successfully");
        
        // Redirect to login
        router.push('/login?registered=true');
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      setError(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[#EAE7DD]">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-lg rounded-lg px-6 py-8 sm:px-10">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold text-[#382A22] mb-2">Create an account</h2>
            <p className="text-sm text-[#7D5F4A]">
              Join us to start creating chain processes
            </p>
          </div>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#47352B] mb-1">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-[#B09780] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A77C] focus:border-[#BE8A60] bg-white text-[#382A22]"
                placeholder="Your name"
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#47352B] mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-[#B09780] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A77C] focus:border-[#BE8A60] bg-white text-[#382A22]"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#47352B] mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-[#B09780] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A77C] focus:border-[#BE8A60] bg-white text-[#382A22]"
                placeholder="••••••"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-[#8A6A52]">Must be at least 6 characters</p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#47352B] mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-[#B09780] rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4A77C] focus:border-[#BE8A60] bg-white text-[#382A22]"
                placeholder="••••••"
                disabled={loading}
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-md text-sm font-medium text-white gradient-bg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#BE8A60] transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-[#7D5F4A]">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-[#BE8A60] hover:text-[#D4A77C]">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function SignupLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[#EAE7DD]">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-lg rounded-lg p-8 text-center">
          <p className="text-[#7D5F4A]">Loading...</p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupLoading />}>
      <SignupForm />
    </Suspense>
  );
} 