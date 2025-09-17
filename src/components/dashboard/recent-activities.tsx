const activities = [
  {
    id: 1,
    type: "user_verification",
    description: "New user John Doe submitted verification documents",
    time: "2 minutes ago",
    status: "pending",
    icon: "👤",
  },
  {
    id: 2,
    type: "service_provider",
    description: "ABC Repair Services certificate approved",
    time: "15 minutes ago",
    status: "approved",
    icon: "✅",
  },
  {
    id: 3,
    type: "admin_action",
    description: "New admin Sarah Johnson added to the system",
    time: "1 hour ago",
    status: "completed",
    icon: "👨‍💼",
  },
  {
    id: 4,
    type: "user_management",
    description: "User account @mike_wilson deactivated due to reports",
    time: "2 hours ago",
    status: "completed",
    icon: "⚠️",
  },
  {
    id: 5,
    type: "certificate",
    description: "XYZ Cleaning Co. certificate renewal requested",
    time: "3 hours ago",
    status: "pending",
    icon: "📜",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "approved":
    case "completed":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export function RecentActivities() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{activity.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                <p className="text-sm text-gray-500 mt-1">{activity.time}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                {activity.status}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="px-6 py-4 bg-gray-50">
        <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
          View all activities →
        </button>
      </div>
    </div>
  );
}
