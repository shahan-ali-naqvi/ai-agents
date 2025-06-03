"use client";

import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';

export default function Navbar() {
  const { user, logout } = useAuth();
  
  const handleSignOut = async () => {
    try {
      await logout();
      // Redirect is handled inside the logout function
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-white border-b border-[#D6D1C2] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link href="/chain" className="text-[#382A22] font-semibold text-xl hover:text-[#BE8A60] transition-colors">
              <span className="gradient-text">My AI Agent</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {/*<Link 
              href="/chain" 
              className="px-3 py-2 text-sm font-medium text-[#47352B] hover:text-[#BE8A60] hover:bg-[#F5F3ED] rounded-md transition-colors"
            >
              Chain
            </Link>
            <Link 
              href="/ports" 
              className="px-3 py-2 text-sm font-medium text-[#47352B] hover:text-[#BE8A60] hover:bg-[#F5F3ED] rounded-md transition-colors"
            >
              Ports
            </Link>
            <Link 
              href="/api-settings" 
              className="px-3 py-2 text-sm font-medium text-[#47352B] hover:text-[#BE8A60] hover:bg-[#F5F3ED] rounded-md transition-colors"
            >
              API Settings
            </Link>
            */}
            
            {user && (
              <div className="flex items-center ml-4 pl-4 border-l border-[#D6D1C2]">
                <span className="text-sm text-[#7D5F4A] mr-3 hidden sm:inline">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-[#F5F3ED] text-[#624A3B] hover:bg-[#E0DCD0] transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 