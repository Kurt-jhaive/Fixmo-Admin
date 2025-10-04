'use client';

import { useState, useEffect, useCallback } from 'react';
import { testBackendConnection, adminApi } from '@/lib/api';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  totalProviders: number;
  verifiedProviders: number;
  totalCertificates: number;
  pendingApprovals: number;
}

export default function StatusPage() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    totalProviders: 0,
    verifiedProviders: 0,
    totalCertificates: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);

  const loadSystemMetrics = useCallback(async () => {
    try {
      // Load system metrics
      const [users, providers, certificates] = await Promise.all([
        adminApi.getUsers().catch(() => []),
        adminApi.getProviders().catch(() => []),
        adminApi.getCertificates().catch(() => [])
      ]);

      interface StatusItem {
        status?: string;
        verified?: boolean;
      }

      const userArray = Array.isArray(users) ? users : (users as { data?: unknown[] })?.data || [];
      const providerArray = Array.isArray(providers) ? providers : (providers as { data?: unknown[] })?.data || [];
      const certificateArray = Array.isArray(certificates) ? certificates : (certificates as { data?: unknown[] })?.data || [];

      setMetrics({
        totalUsers: userArray.length,
        activeUsers: userArray.filter((u: unknown) => (u as StatusItem).status === 'active').length,
        totalProviders: providerArray.length,
        verifiedProviders: providerArray.filter((p: unknown) => (p as StatusItem).verified).length,
        totalCertificates: certificateArray.length,
        pendingApprovals: [
          ...userArray.filter((u: unknown) => (u as StatusItem).status === 'pending'),
          ...providerArray.filter((p: unknown) => (p as StatusItem).status === 'pending'),
          ...certificateArray.filter((c: unknown) => (c as StatusItem).status === 'pending')
        ].length
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkBackend = useCallback(async () => {
    setBackendStatus('checking');
    
    try {
      const isConnected = await testBackendConnection();
      setBackendStatus(isConnected ? 'connected' : 'disconnected');
      setLastChecked(new Date());
      
      if (isConnected) {
        await loadSystemMetrics();
      }
    } catch {
      setBackendStatus('disconnected');
      setLastChecked(new Date());
    }
  }, [loadSystemMetrics]);

  useEffect(() => {
    checkBackend();
  }, [checkBackend]);

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
        <h1 className="text-3xl font-bold text-gray-900">System Status & Analytics</h1>
        <p className="text-gray-600 mt-2">
          Monitor system health and key performance metrics for the Fixmo platform.
        </p>
      </div>

      {/* Connection Status */}
      <div className={`border rounded-lg p-6 ${getStatusBg()}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${
              backendStatus === 'connected' ? 'bg-green-500' :
              backendStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
            } ${backendStatus === 'checking' ? 'animate-pulse' : ''}`}></div>
            <h2 className={`text-xl font-semibold ${getStatusColor()}`}>
              System: {backendStatus.charAt(0).toUpperCase() + backendStatus.slice(1)}
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

        {lastChecked && (
          <div className="text-sm text-gray-600">
            <strong>Last Updated:</strong> {lastChecked.toLocaleString()}
          </div>
        )}

        {backendStatus === 'connected' && (
          <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded">
            <p className="text-green-800 text-sm">
              ✅ All systems operational. Platform is running smoothly.
            </p>
          </div>
        )}

        {backendStatus === 'disconnected' && (
          <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded">
            <p className="text-red-800 text-sm">
              ❌ System connectivity issues detected. Please contact technical support.
            </p>
          </div>
        )}
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : metrics.totalUsers.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <span className="text-green-600 font-medium">{loading ? '...' : metrics.activeUsers}</span> active users
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Service Providers</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : metrics.totalProviders.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔧</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <span className="text-green-600 font-medium">{loading ? '...' : metrics.verifiedProviders}</span> verified
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Certificates</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : metrics.totalCertificates.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Certificates managed
          </div>
        </div>
      </div>

      {/* Pending Approvals Alert */}
      {metrics.pendingApprovals > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Pending Approvals</h3>
              <p className="text-yellow-700">
                You have <strong>{metrics.pendingApprovals}</strong> items requiring your review and approval.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* System Health Information */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">✅ System Status</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• User registration and authentication</li>
              <li>• Service provider onboarding</li>
              <li>• Certificate verification system</li>
              <li>• Admin management tools</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-3">📊 Performance Metrics</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Real-time data synchronization</li>
              <li>• Automated approval workflows</li>
              <li>• Secure admin access controls</li>
              <li>• Activity monitoring and logging</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
