"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminApi, Admin, authApi } from "@/lib/api";

const rolePermissions = {
  "super_admin": ["user_management", "provider_approval", "certificate_review", "admin_management", "system_settings"],
  "admin": ["user_management", "provider_approval", "certificate_review"],
};

const getStatusBadge = (status: boolean) => {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  if (status) {
    return `${baseClasses} bg-green-100 text-green-800`;
  } else {
    return `${baseClasses} bg-red-100 text-red-800`;
  }
};

export default function AdminsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Check authentication and role authorization
  useEffect(() => {
    const user = authApi.getStoredUser();
    
    // Check if user is authenticated
    if (!authApi.isAuthenticated() || !user) {
      router.push('/login');
      return;
    }

    // Check if user has super_admin role
    if (user.role !== 'super_admin') {
      // Redirect regular admins to dashboard with a message
      alert('Access Denied: Only Super Admins can access Admin Management.');
      router.push('/dashboard');
      return;
    }

  }, [router]);

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [resetPasswordReason, setResetPasswordReason] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ type: 'deactivate' | 'activate', admin: Admin } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    role: "admin" as "admin" | "super_admin",
  });

  useEffect(() => {
    // Get current user info
    const user = authApi.getStoredUser();
    console.log('Current user from storage:', user); // Debug log
    if (user) {
      setCurrentUser(user as Admin);
    }
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getAdmins();
      
      console.log('Raw API response:', response);
      
      // Ensure we always set an array
      let adminsList = [];
      if (response && response.admins && Array.isArray(response.admins)) {
        adminsList = response.admins;
        console.log('Using response.admins:', adminsList);
      } else if (response && Array.isArray(response)) {
        adminsList = response;
        console.log('Using response as array:', adminsList);
      } else if (response && response.data && Array.isArray(response.data)) {
        adminsList = response.data;
        console.log('Using response.data:', adminsList);
      } else {
        console.warn('Unexpected response format:', response);
      }
      
      // Filter out any invalid admin objects and normalize them
      adminsList = adminsList
        .filter((admin: any) => admin && typeof admin === 'object')
        .map((admin: any) => normalizeAdmin(admin))
        .filter((admin: Admin) => admin.role !== 'super_admin'); // Hide super admins from table
      
      setAdmins(adminsList);
      console.log('Final admins list:', adminsList);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch admins');
      console.error('Error fetching admins:', err);
      setAdmins([]); // Ensure we set an empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.name.trim() || !newAdmin.email.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      const response = await adminApi.inviteAdmin(newAdmin);
      await fetchAdmins(); // Refresh the list
      setShowAddAdminModal(false);
      setNewAdmin({ name: "", email: "", role: "admin" });
      setSuccess(`Admin ${newAdmin.name} invited successfully! Temporary password: ${response.temporary_password || 'Sent via email'}`);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to invite admin');
      console.error('Error inviting admin:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatLastLogin = (loginDate?: string) => {
    if (!loginDate) return 'Never';
    
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

  const formatRole = (role: string) => {
    return role === 'super_admin' ? 'Super Admin' : 'Admin';
  };

  const normalizeAdmin = (adminData: any): Admin => {
    return {
      id: adminData.admin_id || adminData.id || 0,
      username: adminData.admin_username || adminData.username || '',
      email: adminData.admin_email || adminData.email || '',
      name: adminData.admin_name || adminData.name || '',
      role: adminData.admin_role || adminData.role || 'admin',
      is_active: adminData.is_active !== undefined ? adminData.is_active : true,
      must_change_password: adminData.must_change_password || false,
      created_at: adminData.created_at || new Date().toISOString(),
      last_login: adminData.last_login
    };
  };

  const canManageAdmin = (admin: Admin) => {
    // Since we filter out super admins from the table, all shown admins can be managed
    // Super admin can manage all regular admins
    return currentUser?.role === 'super_admin' && admin?.id;
  };

  const handleResetPassword = (admin: Admin) => {
    setSelectedAdmin(admin);
    setResetPasswordReason("");
    setShowResetPasswordModal(true);
  };

  const handleConfirmResetPassword = async () => {
    if (!selectedAdmin) return;
    
    try {
      setActionLoading(true);
      setError(null);
      const response = await adminApi.resetAdminPassword(selectedAdmin.id, resetPasswordReason);
      setSuccess(`Password reset successfully for ${selectedAdmin.name}! New credentials sent via email.`);
      await fetchAdmins();
      setShowResetPasswordModal(false);
      setSelectedAdmin(null);
      setResetPasswordReason("");
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
      console.error('Error resetting password:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = (admin: Admin) => {
    const action = admin.is_active ? 'deactivate' : 'activate';
    setConfirmAction({ type: action, admin });
    setShowConfirmModal(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!confirmAction) return;
    
    try {
      setActionLoading(true);
      setError(null);
      const newStatus = confirmAction.type === 'activate';
      await adminApi.toggleAdminStatus(confirmAction.admin.id, newStatus);
      await fetchAdmins();
      setSuccess(`${confirmAction.admin.name} has been ${confirmAction.type}d successfully.`);
      setShowConfirmModal(false);
      setConfirmAction(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update admin status');
      console.error('Error updating admin status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Show loading or redirect if not authorized
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // Filter admins based on search term
  const filteredAdmins = Array.isArray(admins) ? admins.filter(admin => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      admin.name?.toLowerCase().includes(searchLower) ||
      admin.email?.toLowerCase().includes(searchLower)
    );
  }) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600 mt-2">
            Manage regular administrator accounts and their access permissions.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Super administrators are not shown in this table for security purposes.
          </p>
        </div>
        <button
          onClick={() => setShowAddAdminModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold shadow-lg border-2 border-blue-600 hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
          style={{ color: '#ffffff !important', backgroundColor: '#2563eb !important' }}
        >
          ➕ Add New Admin
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <button 
                onClick={() => setError(null)}
                className="mt-2 text-xs text-red-600 hover:text-red-500 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <div className="mt-2 text-sm text-green-700">{success}</div>
              <button 
                onClick={() => setSuccess(null)}
                className="mt-2 text-xs text-green-600 hover:text-green-500 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">
            {searchTerm ? 'Search Results' : 'Total Admins'}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {loading ? "..." : searchTerm ? `${filteredAdmins.length} of ${Array.isArray(admins) ? admins.length : 0}` : Array.isArray(admins) ? admins.length : 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">Excluding super admins</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Active Admins</div>
          <div className="text-2xl font-bold text-green-600">
            {loading ? "..." : Array.isArray(admins) ? admins.filter(a => a.is_active).length : 0}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Must Change Password</div>
          <div className="text-2xl font-bold text-yellow-600">
            {loading ? "..." : Array.isArray(admins) ? admins.filter(a => a.must_change_password).length : 0}
          </div>
        </div>
      </div>

      {/* Search and Add Admin */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowAddAdminModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            style={{ color: '#ffffff !important', backgroundColor: '#2563eb !important', border: '2px solid #2563eb !important' }}
          >
            👨‍💼 Add New Admin
          </button>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Administrators</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading admins...</p>
          </div>
        ) : (
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
                {filteredAdmins.length > 0 ? (
                  filteredAdmins.map((admin) => (
                    <tr key={admin.id || Math.random()} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {admin.name ? admin.name.split(" ").map(n => n[0]).join("") : "??"}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{admin.name || "Unknown Name"}</div>
                            <div className="text-sm text-gray-500">{admin.email || "No email"}</div>
                            {admin.must_change_password && (
                              <div className="text-xs text-yellow-600 font-medium">Must change password</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatRole(admin.role || 'admin')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(admin.is_active !== undefined ? admin.is_active : false)}>
                          {admin.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatLastLogin(admin.last_login)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {admin.role && rolePermissions[admin.role]?.slice(0, 2).map(permission => (
                            <span key={permission} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {permission.replace("_", " ")}
                            </span>
                          ))}
                          {admin.role && rolePermissions[admin.role]?.length > 2 && (
                            <span className="text-xs text-gray-500">+{rolePermissions[admin.role].length - 2} more</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleResetPassword(admin)}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-white bg-blue-600 border-2 border-blue-600 hover:bg-blue-700 hover:border-blue-700 rounded-md transition-colors duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            style={{ color: '#ffffff !important', backgroundColor: '#2563eb !important' }}
                          >
                            Reset Password
                          </button>
                          {admin.is_active ? (
                            <button 
                              onClick={() => handleToggleStatus(admin)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-white bg-red-600 border-2 border-red-600 hover:bg-red-700 hover:border-red-700 rounded-md transition-colors duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-red-500"
                              style={{ color: '#ffffff !important', backgroundColor: '#dc2626 !important' }}
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleToggleStatus(admin)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-white bg-green-600 border-2 border-green-600 hover:bg-green-700 hover:border-green-700 rounded-md transition-colors duration-200 shadow-md focus:outline-none focus:ring-2 focus:ring-green-500"
                              style={{ color: '#ffffff !important', backgroundColor: '#16a34a !important' }}
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <div className="text-gray-500">
                        {loading ? 'Loading admins...' : 'No administrators found'}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{zIndex: 9999}}>
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-lg">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
                </svg>
                Add New Administrator
              </h3>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Full Name</label>
                <input
                  type="text"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Email Address</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Role</label>
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value as "admin" | "super_admin"})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                >
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                <div className="text-sm font-medium text-blue-900 mb-3">Permissions for {formatRole(newAdmin.role)}:</div>
                <div className="flex flex-wrap gap-2">
                  {rolePermissions[newAdmin.role]?.map(permission => (
                    <span key={permission} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {permission.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  <div className="text-sm text-yellow-800">
                    An invitation email will be sent to the admin with login credentials and access instructions.
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3 border-t border-gray-200">
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border-2 border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                style={{ color: '#1f2937 !important', backgroundColor: '#ffffff !important' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddAdmin}
                disabled={actionLoading || !newAdmin.name.trim() || !newAdmin.email.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border-2 border-blue-600 rounded-md hover:bg-blue-700 hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 shadow-md"
                style={{ color: '#ffffff !important', backgroundColor: '#2563eb !important' }}
              >
                {actionLoading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {actionLoading ? 'Adding...' : 'Add Admin & Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{zIndex: 9999}}>
          <div className="bg-white rounded-lg max-w-lg w-full shadow-xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-lg">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                </svg>
                Reset Password
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                  </svg>
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">
                      Reset password for {selectedAdmin.name}?
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      A new temporary password will be generated and sent via email. The admin will be required to change their password on next login.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Reason for reset (optional)</label>
                <textarea
                  value={resetPasswordReason}
                  onChange={(e) => setResetPasswordReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  placeholder="e.g., Admin forgot password - support ticket #12345"
                  rows={3}
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setSelectedAdmin(null);
                  setResetPasswordReason("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border-2 border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                style={{ color: '#1f2937 !important', backgroundColor: '#ffffff !important' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResetPassword}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border-2 border-blue-600 rounded-md hover:bg-blue-700 hover:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 shadow-md"
                style={{ color: '#ffffff !important', backgroundColor: '#2563eb !important' }}
              >
                {actionLoading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {actionLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{zIndex: 9999}}>
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  confirmAction.type === 'deactivate' ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  <svg className={`w-6 h-6 ${
                    confirmAction.type === 'deactivate' ? 'text-red-600' : 'text-green-600'
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    {confirmAction.type === 'deactivate' ? (
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                    ) : (
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    )}
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {confirmAction.type === 'deactivate' ? 'Deactivate Admin' : 'Activate Admin'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {confirmAction.type === 'deactivate' 
                      ? `Are you sure you want to deactivate ${confirmAction.admin.name}? They will no longer be able to access the admin panel.`
                      : `Are you sure you want to activate ${confirmAction.admin.name}? They will regain access to the admin panel.`
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border-2 border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                style={{ color: '#1f2937 !important', backgroundColor: '#ffffff !important' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmToggleStatus}
                disabled={actionLoading}
                className={`px-4 py-2 text-sm font-medium text-white border-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center focus:outline-none focus:ring-2 transition-all duration-200 shadow-md ${
                  confirmAction.type === 'deactivate' 
                    ? 'bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700 focus:ring-red-500' 
                    : 'bg-green-600 border-green-600 hover:bg-green-700 hover:border-green-700 focus:ring-green-500'
                }`}
                style={{ 
                  color: '#ffffff !important', 
                  backgroundColor: confirmAction.type === 'deactivate' ? '#dc2626 !important' : '#16a34a !important' 
                }}
              >
                {actionLoading && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {actionLoading 
                  ? `${confirmAction.type === 'deactivate' ? 'Deactivating...' : 'Activating...'}`
                  : confirmAction.type === 'deactivate' ? 'Deactivate' : 'Activate'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
