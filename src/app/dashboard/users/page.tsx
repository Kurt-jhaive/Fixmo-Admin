"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, exportApi, type User } from "@/lib/api";
import SmartImage from "@/components/SmartImage";
import KebabMenu, { KebabButton, type KebabMenuItem } from "@/components/ui/KebabMenu";
import ReviewUserModal from "@/components/dashboard/ReviewUserModal";
import VerifyAccountModal from "@/components/dashboard/VerifyAccountModal";
import type { ReasonsData } from "@/types/reasons";
import { useRBAC } from "@/lib/useRBAC";
import { ViewOnlyBanner } from "@/components/ViewOnlyBanner";

// Import reasons data directly
const reasonsData: ReasonsData = {
  "verificationRejection": [
    "Uploaded ID is blurry or unreadable",
    "Name on ID does not match account name",
    "Expired or invalid government ID",
    "Incomplete or inconsistent profile details",
    "Location/address cannot be verified",
    "Suspected fake or tampered ID",
    "Duplicate or multiple accounts using the same ID",
    "Suspicious or fraudulent activity detected"
  ],
  "certificateRejection": [
    "Certificate is expired",
    "Certificate image is unclear or low quality",
    "Certificate does not match the claimed service category",
    "Issuing authority not recognized or not accredited",
    "Certificate appears forged or altered",
    "Missing critical details (e.g., name, date, signature)",
    "Credentials are insufficient to allow service creation"
  ],
  "deactivationReasons": [
    "Multiple unresolved complaints from other users",
    "Repeated violation of platform policies",
    "Fraudulent or suspicious transactions",
    "Harassment or abusive behavior",
    "Consistently poor service ratings or feedback",
    "Failure to fulfill confirmed appointments",
    "Providing false or misleading information during verification"
  ]
};

// Admin Name Display Component - Now uses data from API response
function AdminName({ adminInfo }: { adminInfo?: { name: string; email: string } | null }) {
  if (!adminInfo) return <span>—</span>;
  return <span>{adminInfo.name}</span>;
}

// Admin Avatar Component - Shows initials in avatar
function AdminAvatar({ adminInfo }: { adminInfo?: { name: string; email: string } | null }) {
  if (!adminInfo) return <span>—</span>;

  // Get initials from name
  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return <span>{getInitials(adminInfo.name)}</span>;
}

// Helper function to get primary status
function getPrimaryStatus(user: User): { label: string; color: string } {
  // Priority: Pending Verification > Deactivated > Inactive > Active
  if (!user.is_verified && user.verification_status !== 'rejected') {
    return { label: 'Pending Verification', color: 'yellow' };
  }
  if (!user.is_activated) {
    return { label: 'Deactivated', color: 'red' };
  }
  if (user.verification_status === 'rejected') {
    return { label: 'Rejected', color: 'gray' };
  }
  return { label: 'Active', color: 'green' };
}

// Status Badge Component
function StatusBadge({ status }: { status: { label: string; color: string } }) {
  const colorClasses = {
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    red: 'bg-rose-100 text-rose-800 border-rose-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${colorClasses[status.color as keyof typeof colorClasses]}`}>
      {status.label}
    </span>
  );
}

export default function UsersPage() {
  const { canEdit, canApprove, canReject } = useRBAC('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    search: "",
    verified: undefined as boolean | undefined,
    active: undefined as boolean | undefined,
  });

  // Export States
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [exportFilters, setExportFilters] = useState({
    verification_status: '',
    is_activated: '',
    is_verified: '',
    start_date: '',
    end_date: '',
  });
  const [exporting, setExporting] = useState(false);

  // Modal States
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [deactivationReason, setDeactivationReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [showCustomReason, setShowCustomReason] = useState(false);

  // Helper function to clean user image URLs
  const cleanUserUrls = (user: User): User => {
    return {
      ...user,
      profile_photo: user.profile_photo,
      valid_id: user.valid_id
    };
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('🚀 Attempting to fetch from real API...');
      try {
        const data = await adminApi.getUsers(filters);
        console.log('✅ Real API Success! Data:', data);
        
        const usersArray = data.users || data || [];
        console.log('👤 Users count:', usersArray.length);
        if (usersArray.length > 0) {
          console.log('👤 First user sample:', usersArray[0]);
          console.log('👤 First user verified_by_admin_id:', usersArray[0]?.verified_by_admin_id);
          console.log('👤 First user verification_reviewed_at:', usersArray[0]?.verification_reviewed_at);
        }
        
        const cleanedUsers = usersArray.map(cleanUserUrls);
        setUsers(cleanedUsers);
        return;
      } catch (apiError) {
        console.error('❌ Real API failed:', apiError);
      }
      
      // Fallback mock data
      console.warn('📋 Using mock data as fallback');
      setUsers([
        {
          user_id: 1,
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
          phone_number: "+1234567890",
          profile_photo: "https://res.cloudinary.com/dcx1glkit/image/upload/v1757846167/fixmo/customer-profiles/customer_profile_ejmercado0544_gmail_com_1757846164476.jpg",
          valid_id: "https://res.cloudinary.com/dcx1glkit/image/upload/v1757846167/fixmo/documents/valid_id_sample.jpg",
          user_location: "New York",
          created_at: new Date().toISOString(),
          is_verified: true,
          userName: "johndoe",
          is_activated: true,
          birthday: "1990-01-01",
          exact_location: "123 Main St, New York"
        },
        {
          user_id: 2,
          first_name: "Jane",
          last_name: "Smith",
          email: "jane.smith@example.com",
          phone_number: "+1234567891",
          profile_photo: "https://res.cloudinary.com/demo/image/upload/c_scale,w_100,h_100/woman.jpg",
          valid_id: "https://res.cloudinary.com/demo/image/upload/c_scale,w_300,h_200/sample.jpg",
          user_location: "Los Angeles",
          created_at: new Date().toISOString(),
          is_verified: false,
          userName: "janesmith",
          is_activated: true,
          birthday: "1992-05-15",
          exact_location: "456 Oak Ave, Los Angeles"
        }
      ]);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleVerificationDecision = async (decision: 'approve' | 'reject', reason: string) => {
    if (!actionUser) return;

    try {
      if (decision === 'approve') {
        await adminApi.verifyUser(actionUser.user_id);
      } else {
        await adminApi.rejectUser(actionUser.user_id, reason);
      }
      fetchUsers();
      setShowVerifyModal(false);
      setActionUser(null);
      setOpenMenuId(null);
    } catch (error) {
      console.error(`Failed to ${decision} user:`, error);
      alert(error instanceof Error ? error.message : `Failed to ${decision} user`);
    }
  };

  const handleVerifyUser = async (userId: number) => {
    try {
      await adminApi.verifyUser(userId);
      fetchUsers();
      setShowReviewModal(false);
      setActionUser(null);
      setOpenMenuId(null);
    } catch (error) {
      console.error("Failed to verify user:", error);
      alert(error instanceof Error ? error.message : 'Failed to approve user');
    }
  };

  const handleApproveClick = (user: User) => {
    setActionUser(user);
    setShowReviewModal(true);
    setOpenMenuId(null);
  };

  const handleRejectUser = (user: User) => {
    setActionUser(user);
    setRejectionReason("");
    setCustomReason("");
    setShowCustomReason(false);
    setShowRejectModal(true);
    setOpenMenuId(null);
  };

  const handleDeactivateUser = (user: User) => {
    setActionUser(user);
    setDeactivationReason("");
    setCustomReason("");
    setShowCustomReason(false);
    setShowDeactivateModal(true);
    setOpenMenuId(null);
  };

  const confirmRejectUser = async () => {
    if (!actionUser) return;
    
    const finalReason = showCustomReason ? customReason : rejectionReason;
    if (!finalReason.trim()) {
      alert("Please select or enter a rejection reason");
      return;
    }

    try {
      await adminApi.rejectUser(actionUser.user_id, finalReason);
      setShowRejectModal(false);
      setActionUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Failed to reject user:", error);
    }
  };

  const confirmDeactivateUser = async () => {
    if (!actionUser) return;
    
    const finalReason = showCustomReason ? customReason : deactivationReason;
    if (!finalReason.trim()) {
      alert("Please select or enter a deactivation reason");
      return;
    }

    try {
      await adminApi.deactivateUser(actionUser.user_id, finalReason);
      setShowDeactivateModal(false);
      setActionUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Failed to deactivate user:", error);
    }
  };

  const handleActivateUser = async (userId: number) => {
    try {
      await adminApi.activateUser(userId);
      setOpenMenuId(null);
      fetchUsers();
    } catch (error) {
      console.error("Failed to activate user:", error);
    }
  };

  const viewUserDetails = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleExport = async () => {
    if (!exportFormat) {
      alert('Please select an export format');
      return;
    }

    try {
      setExporting(true);
      
      const exportParams = {
        format: exportFormat,
        search: exportFilters.verification_status || exportFilters.is_activated || exportFilters.is_verified ? '' : (filters.search || ''),
        verification_status: exportFilters.verification_status,
        is_activated: exportFilters.is_activated,
        is_verified: exportFilters.is_verified,
        start_date: exportFilters.start_date,
        end_date: exportFilters.end_date,
      };

      const blob = await exportApi.exportUsers(exportParams);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setShowExportModal(false);
      alert('Export successful!');
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  };

  // Get kebab menu items for a user
  const getKebabMenuItems = (user: User): KebabMenuItem[] => {
    const isPending = !user.is_verified && user.verification_status !== 'rejected';
    
    return [
      {
        label: 'View Profile',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ),
        onClick: () => viewUserDetails(user),
        variant: 'primary',
      },
      {
        label: 'Verify Account',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        onClick: () => handleApproveClick(user),
        variant: 'success',
        hidden: !isPending || !canApprove,
      },
      {
        label: 'Reject Verification',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        onClick: () => handleRejectUser(user),
        variant: 'danger',
        hidden: !isPending || !canReject,
      },
      {
        label: user.is_activated ? 'Deactivate Account' : 'Activate Account',
        icon: user.is_activated ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        onClick: () => {
          if (user.is_activated) {
            handleDeactivateUser(user);
          } else {
            handleActivateUser(user.user_id);
          }
        },
        variant: user.is_activated ? 'danger' : 'success',
        hidden: !canEdit,
      },
    ];
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch = filters.search === "" || 
      user.first_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.last_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.phone_number.includes(filters.search);

    const matchesVerified = filters.verified === undefined || user.is_verified === filters.verified;
    const matchesActive = filters.active === undefined || user.is_activated === filters.active;

    return matchesSearch && matchesVerified && matchesActive;
  });

  return (
    <div className="p-6 space-y-6">
      <ViewOnlyBanner module="users" />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage and verify user accounts</p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Data
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Verification Status Filter */}
          <select
            value={filters.verified === undefined ? "" : filters.verified ? "verified" : "unverified"}
            onChange={(e) => setFilters({ 
              ...filters, 
              verified: e.target.value === "" ? undefined : e.target.value === "verified" 
            })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Verification Status</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>

          {/* Active Status Filter */}
          <select
            value={filters.active === undefined ? "" : filters.active ? "active" : "inactive"}
            onChange={(e) => setFilters({ 
              ...filters, 
              active: e.target.value === "" ? undefined : e.target.value === "active" 
            })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Active Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Results count */}
        <div className="mt-3 text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filteredUsers.length}</span> of{" "}
          <span className="font-semibold text-gray-900">{users.length}</span> users
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verified By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => {
                  const primaryStatus = getPrimaryStatus(user);
                  
                  return (
                    <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <SmartImage
                              src={user.profile_photo}
                              alt={`${user.first_name} ${user.last_name}`}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100"
                              fallbackType="profile"
                              fallbackContent={
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ring-2 ring-gray-100">
                                  <span className="text-sm font-semibold text-white">
                                    {user.first_name[0]}{user.last_name[0]}
                                  </span>
                                </div>
                              }
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-gray-500">@{user.userName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.phone_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.user_location || "—"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={primaryStatus} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.verified_by_admin ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                              <AdminAvatar adminInfo={user.verified_by_admin} />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 text-sm">
                                <AdminName adminInfo={user.verified_by_admin} />
                              </span>
                              {user.verification_reviewed_at && (
                                <span className="text-xs text-gray-500">
                                  {new Date(user.verification_reviewed_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                        <KebabButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === user.user_id ? null : user.user_id);
                          }}
                          isOpen={openMenuId === user.user_id}
                        />
                        <KebabMenu
                          items={getKebabMenuItems(user)}
                          isOpen={openMenuId === user.user_id}
                          onClose={() => setOpenMenuId(null)}
                          position="right"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredUsers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-lg font-medium text-gray-900">No users found</p>
            <p className="mt-1 text-sm text-gray-500">
              {users.length === 0 ? "No users in the system yet." : "Try adjusting your filters."}
            </p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative mx-auto w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 max-w-2xl bg-white rounded-xl shadow-2xl max-h-[95vh] overflow-hidden my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">User Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-8rem)]">
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center space-x-6 pb-4 border-b border-gray-200">
                  <SmartImage
                    src={selectedUser.profile_photo}
                    alt={`${selectedUser.first_name} ${selectedUser.last_name}`}
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-full object-cover ring-4 ring-blue-100"
                    fallbackType="profile"
                    fallbackContent={
                      <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ring-4 ring-blue-100">
                        <span className="text-2xl font-bold text-white">
                          {selectedUser.first_name[0]}{selectedUser.last_name[0]}
                        </span>
                      </div>
                    }
                  />
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-gray-900">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </h4>
                    <p className="text-lg text-gray-600">@{selectedUser.userName}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <StatusBadge status={getPrimaryStatus(selectedUser)} />
                    </div>
                  </div>
                </div>

                {/* User Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                      <p className="text-base text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                      <p className="text-base text-gray-900">{selectedUser.phone_number}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                      <p className="text-base text-gray-900">{selectedUser.user_location || "Not specified"}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Birthday</label>
                      <p className="text-base text-gray-900">
                        {selectedUser.birthday ? new Date(selectedUser.birthday).toLocaleDateString() : "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admin Action Tracking */}
                {(selectedUser.verified_by_admin || selectedUser.deactivated_by_admin) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                      </svg>
                      Admin Action History
                    </h4>
                    <div className="space-y-2 text-sm">
                      {selectedUser.verified_by_admin && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Verified by:</span>
                            <span className="font-medium text-gray-900">
                              {selectedUser.verified_by_admin.name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Admin Email:</span>
                            <span className="font-medium text-gray-900">
                              {selectedUser.verified_by_admin.email}
                            </span>
                          </div>
                        </>
                      )}
                      {selectedUser.verification_reviewed_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">Reviewed at:</span>
                          <span className="font-medium text-gray-900">
                            {new Date(selectedUser.verification_reviewed_at).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedUser.deactivated_by_admin && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Deactivated by:</span>
                            <span className="font-medium text-gray-900">
                              {selectedUser.deactivated_by_admin.name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Admin Email:</span>
                            <span className="font-medium text-gray-900">
                              {selectedUser.deactivated_by_admin.email}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Valid ID Section */}
                {selectedUser.valid_id && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Valid ID Document</label>
                    <SmartImage
                      src={selectedUser.valid_id}
                      alt="Valid ID"
                      width={600}
                      height={400}
                      className="w-full rounded-lg border border-gray-200"
                      fallbackType="document"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review User Verification Modal */}
      {showReviewModal && actionUser && (
        <ReviewUserModal
          isOpen={showReviewModal}
          user={actionUser}
          onApprove={() => handleVerifyUser(actionUser.user_id)}
          onReject={() => {
            setShowReviewModal(false);
            handleRejectUser(actionUser);
          }}
          onClose={() => {
            setShowReviewModal(false);
            setActionUser(null);
          }}
        />
      )}

      {/* Verify Account Modal (Alternative Quick Verify) */}
      {showVerifyModal && actionUser && (
        <VerifyAccountModal
          isOpen={showVerifyModal}
          accountType="user"
          accountName={`${actionUser.first_name} ${actionUser.last_name}`}
          onConfirm={handleVerificationDecision}
          onClose={() => {
            setShowVerifyModal(false);
            setActionUser(null);
          }}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && actionUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Verification</h3>
            <p className="text-gray-600 mb-4">
              Rejecting verification for{" "}
              <span className="font-semibold">{actionUser.first_name} {actionUser.last_name}</span>
            </p>
            
            {!showCustomReason ? (
              <div className="space-y-4">
                <select
                  value={rejectionReason}
                  onChange={(e) => {
                    if (e.target.value === "custom") {
                      setShowCustomReason(true);
                    } else {
                      setRejectionReason(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a reason</option>
                  {reasonsData.verificationRejection.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                  <option value="custom">Other (Custom reason)</option>
                </select>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter custom rejection reason..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    setShowCustomReason(false);
                    setCustomReason("");
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  ← Back to predefined reasons
                </button>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setActionUser(null);
                  setRejectionReason("");
                  setCustomReason("");
                  setShowCustomReason(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmRejectUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Modal */}
      {showDeactivateModal && actionUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deactivate User Account</h3>
            <p className="text-gray-600 mb-4">
              Deactivating account for{" "}
              <span className="font-semibold">{actionUser.first_name} {actionUser.last_name}</span>
            </p>
            
            {!showCustomReason ? (
              <div className="space-y-4">
                <select
                  value={deactivationReason}
                  onChange={(e) => {
                    if (e.target.value === "custom") {
                      setShowCustomReason(true);
                    } else {
                      setDeactivationReason(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a reason</option>
                  {reasonsData.deactivationReasons.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                  <option value="custom">Other (Custom reason)</option>
                </select>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter custom deactivation reason..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    setShowCustomReason(false);
                    setCustomReason("");
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  ← Back to predefined reasons
                </button>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setActionUser(null);
                  setDeactivationReason("");
                  setCustomReason("");
                  setShowCustomReason(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeactivateUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Deactivate Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Users Data</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setExportFormat('csv')}
                    className={`flex-1 px-4 py-2 border rounded-lg ${
                      exportFormat === 'csv'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => setExportFormat('pdf')}
                    className={`flex-1 px-4 py-2 border rounded-lg ${
                      exportFormat === 'pdf'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    PDF
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range (Optional)</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={exportFilters.start_date}
                    onChange={(e) => setExportFilters({ ...exportFilters, start_date: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    value={exportFilters.end_date}
                    onChange={(e) => setExportFilters({ ...exportFilters, end_date: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="End Date"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={exporting}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Exporting...
                  </>
                ) : (
                  'Export'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
