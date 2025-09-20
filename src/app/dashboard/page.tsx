import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { ErrorBoundary } from "@/components/error-boundary";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Fixmo Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage users, service providers, and certificates from your central admin panel.
        </p>
      </div>
      
      <ErrorBoundary fallback={
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Unable to load dashboard statistics. Using fallback data.</p>
        </div>
      }>
        <StatsCards />
      </ErrorBoundary>
      
      <ErrorBoundary fallback={
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Unable to load recent activities.</p>
        </div>
      }>
        <RecentActivities />
      </ErrorBoundary>
    </div>
  );
}
