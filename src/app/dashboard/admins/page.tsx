"use client";

import { useState } from "react";

const admins = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah@fixmo.com",
    role: "Senior Admin",
    status: "active",
    joinDate: "2023-06-15",
    lastLogin: "2024-03-17T10:30:00Z",
    permissions: ["user_management", "provider_approval", "certificate_review"],
  },
  {
    id: 2,
    name: "Michael Chen",
    email: "michael@fixmo.com",
    role: "Admin",
    status: "active",
    joinDate: "2023-08-20",
    lastLogin: "2024-03-16T14:20:00Z",
    permissions: ["user_management", "certificate_review"],
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    email: "emily@fixmo.com",
    role: "Junior Admin",
    status: "inactive",
    joinDate: "2024-01-10",
    lastLogin: "2024-03-10T09:15:00Z",
    permissions: ["certificate_review"],
  },
];

const rolePermissions = {
  "Super Admin": ["user_management", "provider_approval", "certificate_review", "admin_management", "system_settings"],
  "Senior Admin": ["user_management", "provider_approval", "certificate_review"],
  "Admin": ["user_management", "certificate_review"],
  "Junior Admin": ["certificate_review"],
};

const getStatusBadge = (status: string) => {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  switch (status) {
    case "active":
      return `${baseClasses} bg-green-100 text-green-800`;
    case "inactive":
      return `${baseClasses} bg-red-100 text-red-800`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};

export default function AdminsPage() {
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    role: "Junior Admin",
  });

  const handleAddAdmin = () => {
    // In a real app, this would make an API call and send an email
    console.log("Adding new admin:", newAdmin);
    setShowAddAdminModal(false);
    setNewAdmin({ name: "", email: "", role: "Junior Admin" });
  };

  const handleSendInvite = (adminId: number) => {
    console.log(`Sending invite to admin ${adminId}`);
  };

  const formatLastLogin = (loginDate: string) => {
    const date = new Date(loginDate);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600 mt-2">
            Manage administrator accounts and their access permissions.
          </p>
        </div>
        <button
          onClick={() => setShowAddAdminModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add New Admin
        </button>
      </div>

      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Total Admins</div>
          <div className="text-2xl font-bold text-gray-900">{admins.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Active Admins</div>
          <div className="text-2xl font-bold text-green-600">
            {admins.filter(a => a.status === "active").length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Pending Invites</div>
          <div className="text-2xl font-bold text-yellow-600">0</div>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Administrators</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {admin.name.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                        <div className="text-sm text-gray-500">{admin.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {admin.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(admin.status)}>
                      {admin.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatLastLogin(admin.lastLogin)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {admin.permissions.slice(0, 2).map(permission => (
                        <span key={permission} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {permission.replace("_", " ")}
                        </span>
                      ))}
                      {admin.permissions.length > 2 && (
                        <span className="text-xs text-gray-500">+{admin.permissions.length - 2} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSendInvite(admin.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Send Invite
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        Edit
                      </button>
                      {admin.status === "active" && (
                        <button className="text-red-600 hover:text-red-900">
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Administrator</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="Junior Admin">Junior Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Senior Admin">Senior Admin</option>
                </select>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="text-sm font-medium text-gray-700 mb-2">Permissions for {newAdmin.role}:</div>
                <div className="flex flex-wrap gap-1">
                  {rolePermissions[newAdmin.role as keyof typeof rolePermissions]?.map(permission => (
                    <span key={permission} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {permission.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-md">
                <div className="text-sm text-yellow-800">
                  📧 An invitation email will be sent to the admin with login credentials and access instructions.
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAdmin}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Add Admin & Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
