"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { useSearchParams } from 'next/navigation';

function LoginForm() {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const redirectPath = searchParams.get('redirect') || '/chain';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Check if redirected from registration
  useEffect(() => {
    if (registered === 'true') {
      setSuccess('Account created successfully. Please log in.');
    }
  }, [registered]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      await signInWithEmail(email, password);
      // After successful login, redirect to the intended path
      window.location.href = redirectPath;
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      const user = await signInWithGoogle();
      // If we got a user immediately, redirect
      if (user) {
        window.location.href = redirectPath;
      }
      // Otherwise the redirection will be handled by the auth provider after redirect flow
    } catch (error: any) {
      console.error('Google login error:', error);
      setError(error.message || 'Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-[#EAE7DD]">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-lg rounded-lg px-6 py-8 sm:px-10">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold text-[#382A22] mb-2">Sign in</h2>
            <p className="text-sm text-[#7D5F4A]">
              Access your account
            </p>
          </div>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              {success}
            </div>
          )}
          
          <form className="space-y-5" onSubmit={handleSubmit}>
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#C7C0AD]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-[#8A6A52]">Or continue with</span>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full flex justify-center items-center gap-3 py-2 px-4 border border-[#D6D1C2] rounded-md shadow-sm bg-white text-[#47352B] hover:bg-[#F5F3ED] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#BE8A60] transition-colors disabled:opacity-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
                {googleLoading ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-[#7D5F4A]">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-[#BE8A60] hover:text-[#D4A77C]">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function LoginLoading() {
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

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
} 