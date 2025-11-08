'use client';

import Link from 'next/link';

export function RecentActivities() {
  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      href: '/dashboard/users',
      icon: '👥',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Service Providers',
      description: 'Review service provider applications',
      href: '/dashboard/service-providers',
      icon: '🔧',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Certificates',
      description: 'Manage certificates and verifications',
      href: '/dashboard/certificates',
      icon: '📋',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Appointments',
      description: 'Manage appointments and disputes',
      href: '/dashboard/appointments',
      icon: '�',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <div className="space-y-6">

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group block"
            >
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow group-hover:border-blue-300">
                <div className="flex items-center mb-3">
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center text-white text-lg mr-3 transition-colors`}>
                    {action.icon}
                  </div>
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Management Tips */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Management Tips</h2>
        <div className="space-y-3">
          <div className="flex items-start">
            <span className="text-blue-500 text-lg mr-3">💡</span>
            <div>
              <h4 className="font-medium text-gray-900">Regular Reviews</h4>
              <p className="text-sm text-gray-600">Check pending applications and verifications daily for optimal user experience.</p>
            </div>
          </div>
          <div className="flex items-start">
            <span className="text-green-500 text-lg mr-3">✅</span>
            <div>
              <h4 className="font-medium text-gray-900">Quality Control</h4>
              <p className="text-sm text-gray-600">Thoroughly review service provider certificates before approval.</p>
            </div>
          </div>
          <div className="flex items-start">
            <span className="text-orange-500 text-lg mr-3">📊</span>
            <div>
              <h4 className="font-medium text-gray-900">Monitor Trends</h4>
              <p className="text-sm text-gray-600">Keep track of user activity and system performance metrics.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}