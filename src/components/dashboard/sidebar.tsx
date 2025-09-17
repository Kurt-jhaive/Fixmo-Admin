"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "📊",
  },
  {
    href: "/dashboard/users",
    label: "User Management",
    icon: "👥",
  },
  {
    href: "/dashboard/service-providers",
    label: "Service Providers",
    icon: "🔧",
  },
  {
    href: "/dashboard/certificates",
    label: "Certificates",
    icon: "📜",
  },
  {
    href: "/dashboard/admins",
    label: "Admin Management",
    icon: "👨‍💼",
  },
  {
    href: "/dashboard/status",
    label: "System Status",
    icon: "🟢",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`}>
      <div className="p-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
            F
          </div>
          {!isCollapsed && <span className="text-xl font-bold">Fixmo Admin</span>}
        </div>
      </div>
      
      <nav className="mt-8">
        {menuItems.map((item) => (
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
          className="text-gray-400 hover:text-white"
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>
    </div>
  );
}
