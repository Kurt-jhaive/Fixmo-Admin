"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authApi } from "@/lib/api";

const menuItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "📊",
    roles: ["admin", "super_admin"], // Both roles can access
  },
  {
    href: "/dashboard/users",
    label: "User Management",
    icon: "👥",
    roles: ["admin", "super_admin"], // Both roles can access
  },
  {
    href: "/dashboard/service-providers",
    label: "Service Providers",
    icon: "🔧",
    roles: ["admin", "super_admin"], // Both roles can access
  },
  {
    href: "/dashboard/certificates",
    label: "Certificates",
    icon: "📜",
    roles: ["admin", "super_admin"], // Both roles can access
  },
  {
    href: "/dashboard/appointments",
    label: "Appointments",
    icon: "📅",
    roles: ["admin", "super_admin"], // Both roles can access
  },
  {
    href: "/dashboard/admins",
    label: "Admin Management",
    icon: "👨‍💼",
    roles: ["super_admin"], // Only super_admin can access
  },
  {
    href: "/dashboard/status",
    label: "System Status",
    icon: "🟢",
    roles: ["admin", "super_admin"], // Both roles can access
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Get user data from localStorage
    const user = authApi.getStoredUser();
    if (user) {
      setUserRole(user.role);
    }
  }, []);

  // Filter menu items based on user role
  const accessibleMenuItems = menuItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`}>
      <div className="p-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
            F
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold text-white">Fixmo Admin</span>
          )}
        </div>
      </div>
      
      <nav className="mt-8">
        {accessibleMenuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center space-x-3 px-4 py-3 hover:bg-gray-800 transition-colors ${
              pathname === item.href ? "bg-gray-800 border-r-4 border-blue-500" : ""
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {!isCollapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
      
      <div className="absolute bottom-4 left-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-center w-8 h-8 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-all duration-200 shadow-lg border border-gray-700"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg 
            className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 19l-7-7 7-7" 
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
