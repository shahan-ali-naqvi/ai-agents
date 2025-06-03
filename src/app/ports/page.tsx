"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function PortsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state for new port
  const [newPort, setNewPort] = useState({
    name: '',
    portNumber: 8080,
    protocol: 'http',
    host: 'localhost',
    description: ''
  });

  // Check authentication
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Fetch ports
  const fetchPorts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await user?.getIdToken();
      
      const response = await fetch('/api/ports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch ports');
      }
      
      const data = await response.json();
      setPorts(data.ports || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load ports on component mount
  useEffect(() => {
    if (user) {
      fetchPorts();
    }
  }, [user]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPort(prev => ({
      ...prev,
      [name]: name === 'portNumber' ? parseInt(value) || 0 : value
    }));
  };

  // Create new port
  const handleCreatePort = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const token = await user?.getIdToken();
      
      const response = await fetch('/api/ports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPort)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create port');
      }
      
      // Reset form and close modal
      setNewPort({
        name: '',
        portNumber: 8080,
        protocol: 'http',
        host: 'localhost',
        description: ''
      });
      setShowAddModal(false);
      
      // Refresh ports list
      fetchPorts();
    } catch (err: any) {
      setError(err.message || 'Failed to create port');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Generate URL from port
  const generatePortUrl = (port: Port) => {
    if (!port.isActive) return null;
    return `${port.protocol}://${port.host}:${port.portNumber}`;
  };

  // If loading or not authenticated yet
  if (loading && !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Page navigation */}
      <div className="flex justify-center mb-4 space-x-4">
        <Link href="/chain" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          Chain
        </Link>
        <Link href="/ports" className="px-4 py-2 bg-indigo-700 text-white rounded-md">
          Ports
        </Link>
        <Link href="/api-settings" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          API Settings
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-indigo-900">URL Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Add New Endpoint
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {loading && !showAddModal ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {ports.length === 0 ? (
            <div className="p-6 text-center text-black">
              <p>No endpoints found. Add your first endpoint to get started.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">URL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ports.map(port => (
                  <tr key={port.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-black">{port.name}</div>
                      {port.description && (
                        <div className="text-sm text-black">{port.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {generatePortUrl(port) || 'Inactive'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        port.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {port.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      
      {/* Add Port Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4 text-indigo-900">Add New Endpoint</h2>
            
            <form onSubmit={handleCreatePort}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newPort.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="host" className="block text-sm font-medium text-gray-700 mb-1">
                  Host
                </label>
                <input
                  type="text"
                  id="host"
                  name="host"
                  value={newPort.host}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="protocol" className="block text-sm font-medium text-gray-700 mb-1">
                    Protocol
                  </label>
                  <select
                    id="protocol"
                    name="protocol"
                    value={newPort.protocol}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="http">HTTP</option>
                    <option value="https">HTTPS</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="portNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    id="portNumber"
                    name="portNumber"
                    min="1"
                    max="65535"
                    value={newPort.portNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={newPort.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="flex justify-end mt-6 space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 