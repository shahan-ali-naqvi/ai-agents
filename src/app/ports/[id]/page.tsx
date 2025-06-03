"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';

interface Port {
  id: string;
  name: string;
  portNumber: number;
  protocol: string;
  host: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EditPortPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [port, setPort] = useState<Port | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    portNumber: 0,
    protocol: 'http',
    host: 'localhost',
    description: '',
    isActive: true
  });

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch port details
  useEffect(() => {
    const fetchPort = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const token = await user.getIdToken();
        
        const response = await fetch(`/api/ports/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/ports');
            return;
          }
          throw new Error('Failed to fetch port details');
        }
        
        const data = await response.json();
        setPort(data.port);
        setFormData({
          name: data.port.name,
          portNumber: data.port.portNumber,
          protocol: data.port.protocol,
          host: data.port.host,
          description: data.port.description || '',
          isActive: data.port.isActive
        });
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPort();
  }, [id, user, router]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : (name === 'portNumber' ? parseInt(value) || 0 : value)
    }));
  };

  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Update port
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      const token = await user?.getIdToken();
      
      const response = await fetch(`/api/ports/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update port');
      }
      
      router.push('/ports');
    } catch (err: any) {
      setError(err.message || 'Failed to update port');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // If loading or not authenticated yet
  if (authLoading || (loading && !user)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <Link href="/ports" className="text-indigo-600 hover:text-indigo-900 mr-4">
          &larr; Back to Ports
        </Link>
        <h1 className="text-2xl font-bold text-indigo-900">Edit Port</h1>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-black mb-1">
                Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Service name"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="portNumber" className="block text-sm font-medium text-black mb-1">
                Port Number *
              </label>
              <input
                id="portNumber"
                name="portNumber"
                type="number"
                min="1"
                max="65535"
                value={formData.portNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="protocol" className="block text-sm font-medium text-black mb-1">
                  Protocol
                </label>
                <select
                  id="protocol"
                  name="protocol"
                  value={formData.protocol}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                  <option value="tcp">TCP</option>
                  <option value="udp">UDP</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="host" className="block text-sm font-medium text-black mb-1">
                  Host
                </label>
                <input
                  id="host"
                  name="host"
                  type="text"
                  value={formData.host}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="localhost"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-black mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Optional description"
              />
            </div>
            
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-black">
                  Active
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Link
                href="/ports"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 