"use client";

import { useEffect, useState } from "react";
import { adminApi, testBackendConnection, type DashboardStats } from "@/lib/api";

export function StatsCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // First test backend connection with better error handling
        console.log('Testing backend connection...');
        const isConnected = await testBackendConnection();
        console.log('Backend connection result:', isConnected);
        
        setBackendStatus(isConnected ? 'connected' : 'disconnected');
        
        if (isConnected) {
          console.log('Backend connected, fetching real data...');
          try {
            const data = await adminApi.getDashboardStats();
            // Map API response to DashboardStats interface
            setStats({
              totalUsers: (data as Record<string, number>).totalUsers || 0,
              totalProviders: (data as Record<string, number>).activeServiceProviders || (data as Record<string, number>).totalProviders || 0,
              totalAppointments: (data as Record<string, number>).totalAppointments || 0,
              totalRevenue: (data as Record<string, number>).totalRevenue || 0,
              pendingVerifications: (data as Record<string, number>).pendingVerifications || 0,
              activeDisputes: (data as Record<string, number>).activeDisputes || 0,
            });
          } catch (apiError) {
            console.error('API call failed even though backend is connected:', apiError);
            setBackendStatus('disconnected');
            // Use mock data as fallback
            setStats({
              totalUsers: 156,
              totalProviders: 43,
              totalAppointments: 89,
              totalRevenue: 45600,
              pendingVerifications: 12,
              activeDisputes: 3,
            });
          }
        } else {
          console.log('Backend not connected, using mock data');
          // Use mock data when backend is not available
          setStats({
            totalUsers: 156,
            totalProviders: 43,
            totalAppointments: 89,
            totalRevenue: 45600,
            pendingVerifications: 12,
            activeDisputes: 3,
          });
        }
      } catch (error) {
        console.error("Error in fetchStats:", error);
        setBackendStatus('disconnected');
        // Fallback to mock data
        setStats({
          totalUsers: 156,
          totalProviders: 43,
          totalAppointments: 89,
          totalRevenue: 45600,
          pendingVerifications: 12,
          activeDisputes: 3,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsConfig = [
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: "👥",
      color: "text-blue-600",
    },
    {
      title: "Service Providers",
      value: stats?.totalProviders || 0,
      icon: "🔧",
      color: "text-green-600",
    },
    {
      title: "Pending Verifications",
      value: stats?.pendingVerifications || 0,
      icon: "⏳",
      color: "text-yellow-600",
    },
    {
      title: "Total Appointments",
      value: stats?.totalAppointments || 0,
      icon: "📅",
      color: "text-purple-600",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Backend Status Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            backendStatus === 'connected' ? 'bg-green-500' : 
            backendStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
          }`}></div>
          <span className="text-sm text-gray-600">
            Backend: {backendStatus === 'connected' ? 'Connected' : 
                     backendStatus === 'disconnected' ? 'Disconnected (using mock data)' : 'Checking...'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((stat) => (
          <div key={stat.title} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold mt-2 ${stat.color}`}>
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className="text-3xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
