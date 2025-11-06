'use client';

import React from 'react';

interface PenaltyStats {
  totalViolations: number;
  weeklyViolations: number;
  pendingAppeals: number;
  suspended: number;
  suspendedUsers: number;
  suspendedProviders: number;
  restrictedUsers: number;
  restrictedProviders: number;
  lastWeekViolations: number;
}

interface PenaltyDashboardProps {
  stats: PenaltyStats;
  onTabChange: (tab: string) => void;
}

export default function PenaltyDashboard({ stats, onTabChange }: PenaltyDashboardProps) {
  // Calculate trend percentage
  const trendPercentage = stats.lastWeekViolations > 0 
    ? Math.round(((stats.weeklyViolations - stats.lastWeekViolations) / stats.lastWeekViolations) * 100)
    : 0;

  // Mock data for most common violations - in real app, this would come from props
  const topViolations = [
    { type: 'Late Cancellation', count: 10 },
    { type: 'No-Show', count: 2 },
    { type: 'No-Show', count: 2 },
    { type: 'Repeated No-Shows', count: 1 },
    { type: 'Multiple Cancellations Same Day', count: 1 },
  ];

  // Mock recent activity data
  const recentActivity = [
    {
      icon: '🔔',
      title: '[New Appeal] Violation #16',
      subtitle: 'Ricardo Martinez',
      action: () => onTabChange('appeals')
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Priority Card - Pending Appeals */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
             onClick={() => onTabChange('appeals')}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-600 text-2xl animate-pulse">⚠️</span>
                <h3 className="text-amber-800 font-semibold text-sm uppercase tracking-wide">Needs Attention</h3>
              </div>
              <div className="text-4xl font-bold text-amber-700 mb-1">{stats.pendingAppeals}</div>
              <p className="text-amber-700 text-sm font-medium">Pending Appeals</p>
            </div>
            <div className="bg-white/50 p-3 rounded-lg">
              <span className="text-3xl">🔔</span>
            </div>
          </div>
        </div>

        {/* Total Violations */}
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">📊 TOTAL VIOLATIONS</p>
              <div className="text-4xl font-bold text-slate-800">{stats.totalViolations}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        {/* Weekly Violations */}
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">📅 WEEKLY VIOLATIONS</p>
              <div className="text-4xl font-bold text-slate-800">{stats.weeklyViolations}</div>
              {trendPercentage !== 0 && (
                <p className={`text-sm font-medium mt-1 ${trendPercentage > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {trendPercentage > 0 ? '↗' : '↘'} {Math.abs(trendPercentage)}% from last week
                </p>
              )}
            </div>
            <div className="bg-amber-50 p-3 rounded-lg">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>

        {/* Suspended */}
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">🚫 SUSPENDED</p>
              <div className="text-4xl font-bold text-slate-800">{stats.suspended}</div>
              <p className="text-gray-500 text-sm mt-1">{stats.suspendedUsers} Users · {stats.suspendedProviders} Providers</p>
            </div>
            <div className="bg-rose-50 p-3 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row - Restricted Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Restricted Users */}
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-gray-700 font-semibold text-lg mb-1">Restricted Users</h3>
              <div className="text-3xl font-bold text-amber-600">{stats.restrictedUsers}</div>
              <p className="text-gray-500 text-sm mt-1">Penalty points &lt; 60</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </div>

        {/* Restricted Providers */}
        <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-gray-700 font-semibold text-lg mb-1">Restricted Providers</h3>
              <div className="text-3xl font-bold text-amber-600">{stats.restrictedProviders}</div>
              <p className="text-gray-500 text-sm mt-1">Penalty points &lt; 60</p>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg">
              <span className="text-2xl">🔧</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Chart and Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Common Violations Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-gray-800 font-semibold text-lg mb-1">Most Common Violations</h3>
          <p className="text-gray-500 text-sm mb-6">Visual breakdown of top violation types</p>
          
          <div className="space-y-4">
            {topViolations.map((violation, index) => {
              const percentage = stats.totalViolations > 0 ? (violation.count / stats.totalViolations) * 100 : 0;
              const colors = [
                'bg-gradient-to-r from-rose-400 to-rose-500',
                'bg-gradient-to-r from-amber-400 to-amber-500',
                'bg-gradient-to-r from-yellow-400 to-yellow-500',
                'bg-gradient-to-r from-orange-400 to-orange-500',
                'bg-gradient-to-r from-purple-400 to-purple-500'
              ];
              
              return (
                <div key={index} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-700 text-sm font-medium group-hover:text-gray-900 transition-colors">
                      {violation.type}
                    </span>
                    <span className="text-gray-900 font-bold text-sm">{violation.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full ${colors[index]} transition-all duration-500 ease-out rounded-full shadow-sm`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Needs Attention Sidebar */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-md p-6 border-l-4 border-amber-500">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">⚠️</span>
            <h3 className="text-gray-800 font-semibold text-lg">Needs Attention</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">Recent activity requiring review</p>
          
          <div className="space-y-3">
            {recentActivity.map((item, index) => (
              <div 
                key={index}
                onClick={() => item.action()}
                className="bg-white rounded-lg p-4 hover:shadow-md transition-all cursor-pointer border border-amber-200 hover:border-amber-300 group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 font-medium text-sm group-hover:text-amber-700 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">{item.subtitle}</p>
                  </div>
                  <span className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => onTabChange('appeals')}
            className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            View All Pending Items →
          </button>
        </div>
      </div>
    </div>
  );
}
