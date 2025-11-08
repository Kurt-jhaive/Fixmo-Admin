'use client';

import { PenaltyDashboardStats, PenaltyViolation, RestrictedAccount } from '@/lib/api';

interface PenaltyDashboardRedesignProps {
  dashboardStats: PenaltyDashboardStats;
  appeals: PenaltyViolation[];
  restrictedUsers: RestrictedAccount[];
  restrictedProviders: RestrictedAccount[];
  setActiveTab: (tab: 'dashboard' | 'violations' | 'appeals' | 'restricted' | 'logs') => void;
}

export default function PenaltyDashboardRedesign({
  dashboardStats,
  appeals,
  restrictedUsers,
  restrictedProviders,
  setActiveTab,
}: PenaltyDashboardRedesignProps) {
  return (
    <div className="space-y-6">
      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Pending Appeals - Priority Card */}
        <div 
          className="bg-gradient-to-br from-amber-50 to-orange-50 border-l-4 border-amber-500 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer" 
          onClick={() => setActiveTab('appeals')}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-amber-600 text-2xl animate-pulse">⚠️</span>
                <div className="text-sm font-semibold text-amber-800 uppercase tracking-wide">Needs Attention</div>
              </div>
              <div className="text-4xl font-bold text-amber-700 mt-3">{dashboardStats.pendingAppeals}</div>
              <div className="text-amber-700 text-sm mt-1 font-medium">Pending Appeals</div>
            </div>
            <div className="bg-white/50 p-3 rounded-lg">
              <span className="text-3xl">🔔</span>
            </div>
          </div>
        </div>

        {/* Total Violations */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">📊 TOTAL VIOLATIONS</p>
              <div className="text-4xl font-bold text-slate-800">{dashboardStats.totalViolations}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        {/* Weekly Violations with Trend */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">📅 WEEKLY VIOLATIONS</p>
              <div className="text-4xl font-bold text-slate-800">{dashboardStats.weeklyViolations}</div>
              <div className="flex items-center mt-2">
                {dashboardStats.weeklyViolations > 10 ? (
                  <span className="text-xs text-rose-600 font-semibold flex items-center">
                    ↗ +{Math.round((dashboardStats.weeklyViolations / 10 - 1) * 100)}% from last week
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">No significant change</span>
                )}
              </div>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>

        {/* Suspended Accounts */}
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-2">🚫 SUSPENDED</p>
              <div className="text-4xl font-bold text-slate-800">
                {dashboardStats.suspendedUsers + dashboardStats.suspendedProviders}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {dashboardStats.suspendedUsers} Users · {dashboardStats.suspendedProviders} Providers
              </div>
            </div>
            <div className="bg-rose-50 p-3 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid - Chart and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Common Violations with Chart - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-800">Most Common Violations</h3>
            <p className="text-sm text-gray-500 mt-1">Visual breakdown of top violation types</p>
          </div>
          <div className="p-6">
            {/* Bar Chart Visualization */}
            <div className="mb-6 space-y-4">
              {dashboardStats.commonViolations.slice(0, 5).map((v, idx) => {
                const maxCount = Math.max(...dashboardStats.commonViolations.map(violation => violation.count));
                const widthPercent = (v.count / maxCount) * 100;
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700 truncate flex-1">{v.violation_name}</span>
                      <span className="font-bold text-gray-900 ml-2">{v.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0 ? 'bg-gradient-to-r from-rose-400 to-rose-500' :
                          idx === 1 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                          idx === 2 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                          idx === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                          'bg-gradient-to-r from-purple-400 to-purple-500'
                        }`}
                        style={{ width: `${widthPercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Data Table */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2">Violation Type</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2">Code</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2">Points</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-2">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dashboardStats.commonViolations.map((v, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 text-sm text-gray-900 font-medium">{v.violation_name}</td>
                      <td className="py-3 text-sm text-gray-500 font-mono">{v.violation_code}</td>
                      <td className="py-3 text-sm text-red-600 font-bold">-{v.penalty_points}</td>
                      <td className="py-3 text-sm text-gray-700 font-semibold">{v.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Needs Attention / Recent Activity - Takes 1 column */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-md border-l-4 border-amber-500">
          <div className="px-6 py-4 border-b border-amber-200 bg-amber-50/50">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-bold text-gray-800">Needs Attention</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">Recent activity requiring review</p>
          </div>
          <div className="p-6 space-y-3">
            {/* Pending Appeals Items */}
            {appeals.slice(0, 3).map((appeal, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab('appeals')}
                className="w-full flex items-start p-3 rounded-lg hover:bg-white transition-all duration-200 border border-amber-200 hover:border-amber-300 text-left group hover:shadow-sm"
              >
                <div className="flex-shrink-0 mt-1">
                  <span className="text-xl">🔔</span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-amber-700">
                    [New Appeal] Violation #{appeal.violation_id}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {appeal.user ? `${appeal.user.first_name} ${appeal.user.last_name}` : 
                     appeal.provider ? `${appeal.provider.provider_first_name} ${appeal.provider.provider_last_name}` : 
                     'User'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{appeal.violation_name}</p>
                </div>
                <span className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
            ))}

            {/* Restricted Accounts Items */}
            {restrictedUsers.slice(0, 2).map((user, idx) => (
              <button
                key={`user-${idx}`}
                onClick={() => setActiveTab('restricted')}
                className="w-full flex items-start p-3 rounded-lg hover:bg-white transition-all duration-200 border border-amber-200 hover:border-amber-300 text-left group hover:shadow-sm"
              >
                <div className="flex-shrink-0 mt-1">
                  <span className="text-xl">⚠️</span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-amber-700">
                    [Restricted] User #{user.user_id}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{user.first_name} {user.last_name}</p>
                  <p className="text-xs text-amber-600 font-semibold mt-1">{user.penalty_points} points remaining</p>
                </div>
                <span className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
            ))}

            {restrictedProviders.slice(0, 2).map((provider, idx) => (
              <button
                key={`provider-${idx}`}
                onClick={() => setActiveTab('restricted')}
                className="w-full flex items-start p-3 rounded-lg hover:bg-white transition-all duration-200 border border-amber-200 hover:border-amber-300 text-left group hover:shadow-sm"
              >
                <div className="flex-shrink-0 mt-1">
                  <span className="text-xl">🔧</span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-amber-700">
                    [Restricted] Provider #{provider.provider_id}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{provider.first_name} {provider.last_name}</p>
                  <p className="text-xs text-amber-600 font-semibold mt-1">{provider.penalty_points} points remaining</p>
                </div>
                <span className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
            ))}

            {/* View All Button */}
            <button
              onClick={() => setActiveTab('appeals')}
              className="w-full mt-4 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-lg hover:from-amber-600 hover:to-orange-500 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              View All Pending Appeals →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
