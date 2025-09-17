'use client';

import { useState, useEffect } from 'react';
import { testBackendConnection } from '@/lib/api';

export default function StatusPage() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkBackend = async () => {
    setBackendStatus('checking');
    setError(null);
    
    try {
      const isConnected = await testBackendConnection();
      setBackendStatus(isConnected ? 'connected' : 'disconnected');
      setLastChecked(new Date());
    } catch (err) {
      setBackendStatus('disconnected');
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  const getStatusColor = () => {
    switch (backendStatus) {
      case 'connected': return 'text-green-600';
      case 'disconnected': return 'text-red-600';
      case 'checking': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = () => {
    switch (backendStatus) {
      case 'connected': return 'bg-green-50 border-green-200';
      case 'disconnected': return 'bg-red-50 border-red-200';
      case 'checking': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
        <p className="text-gray-600 mt-2">
          Check the connection status between the admin dashboard and the backend API.
        </p>
      </div>

      <div className={`border rounded-lg p-6 ${getStatusBg()}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${
              backendStatus === 'connected' ? 'bg-green-500' :
              backendStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
            } ${backendStatus === 'checking' ? 'animate-pulse' : ''}`}></div>
            <h2 className={`text-xl font-semibold ${getStatusColor()}`}>
              Backend API: {backendStatus.charAt(0).toUpperCase() + backendStatus.slice(1)}
            </h2>
          </div>
          <button
            onClick={checkBackend}
            disabled={backendStatus === 'checking'}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {backendStatus === 'checking' ? 'Checking...' : 'Refresh'}
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}
          </div>
          {lastChecked && (
            <div>
              <strong>Last Checked:</strong> {lastChecked.toLocaleString()}
            </div>
          )}
          {error && (
            <div className="bg-red-100 border border-red-200 rounded p-3 mt-3">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t">
          <h3 className="font-semibold mb-3">Troubleshooting Tips:</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
            <li>Make sure your backend server is running on port 3000</li>
            <li>Check if the backend has CORS configured to allow requests from this domain</li>
            <li>Verify that the admin API endpoints are implemented in your backend</li>
            <li>Check the browser console for detailed error messages</li>
            <li>Ensure your .env.local file has the correct NEXT_PUBLIC_API_URL</li>
          </ul>
        </div>

        {backendStatus === 'connected' && (
          <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded">
            <p className="text-green-800 text-sm">
              ✅ Backend is reachable! The admin dashboard should be able to fetch data from your API.
            </p>
          </div>
        )}

        {backendStatus === 'disconnected' && (
          <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded">
            <p className="text-red-800 text-sm">
              ❌ Cannot connect to backend. The dashboard will use mock data until the connection is restored.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">Expected Admin API Endpoints</h3>
        <p className="text-gray-600 mb-4">Based on your API documentation, these endpoints should be available:</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">User Management</h4>
            <ul className="space-y-1 text-gray-600">
              <li>GET /api/admin/users</li>
              <li>GET /api/admin/users/{`{userId}`}</li>
              <li>PUT /api/admin/users/{`{userId}`}/verify</li>
              <li>PUT /api/admin/users/{`{userId}`}/activate</li>
              <li>PUT /api/admin/users/{`{userId}`}/deactivate</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Provider Management</h4>
            <ul className="space-y-1 text-gray-600">
              <li>GET /api/admin/providers</li>
              <li>GET /api/admin/providers/{`{providerId}`}</li>
              <li>PUT /api/admin/providers/{`{providerId}`}/verify</li>
              <li>PUT /api/admin/providers/{`{providerId}`}/activate</li>
              <li>PUT /api/admin/providers/{`{providerId}`}/deactivate</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Certificate Management</h4>
            <ul className="space-y-1 text-gray-600">
              <li>GET /api/admin/certificates</li>
              <li>GET /api/admin/certificates/{`{certId}`}</li>
              <li>PUT /api/admin/certificates/{`{certId}`}/approve</li>
              <li>PUT /api/admin/certificates/{`{certId}`}/reject</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Activities</h4>
            <ul className="space-y-1 text-gray-600">
              <li>GET /api/admin/recent-activity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
