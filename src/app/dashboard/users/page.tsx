"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, type User } from "@/lib/api";
import SmartImage from "@/components/SmartImage";
import type { ReasonsData } from "@/types/reasons";

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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  const [filters, setFilters] = useState({
    search: "",
    verified: undefined as boolean | undefined,
    active: undefined as boolean | undefined,
  });

 

  // Helper function to clean user image URLs
  const cleanUserUrls = (user: User): User => {
    return {
      ...user,
      profile_photo: user.profile_photo,
      valid_id: user.valid_id
    };
  };
  
  // Rejection/Deactivation Modal States
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [deactivationReason, setDeactivationReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [showCustomReason, setShowCustomReason] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // FORCE TRY REAL API FIRST - remove connection test for debugging
      console.log('🚀 Attempting to fetch from real API...');
      try {
        const data = await adminApi.getUsers(filters);
        console.log('✅ Real API Success! Data:', data);
        console.log('� Users array:', data.users || data);
        
        setBackendStatus('connected');
        const usersArray = data.users || data || [];
        console.log('👤 Users count:', usersArray.length);
        if (usersArray.length > 0) {
          console.log('👤 First user:', usersArray[0]);
          console.log('👤 First user profile_photo:', usersArray[0]?.profile_photo);
        }
        
        // Clean image URLs to remove /uploads/ prefix if present
        const cleanedUsers = usersArray.map(cleanUserUrls);
        setUsers(cleanedUsers);
        return; // Exit early if successful
      } catch (apiError) {
        console.error('❌ Real API failed:', apiError);
        setBackendStatus('disconnected');
      }
      
      // If we get here, the real API failed, so use mock data
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
      setBackendStatus('disconnected');
      setUsers([]); // Empty array on error
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleVerifyUser = async (userId: number) => {
    try {
      await adminApi.verifyUser(userId);
      fetchUsers(); // Refresh data
    } catch (error) {
      console.error("Failed to verify user:", error);
    }
  };

  const handleRejectUser = (user: User) => {
    setActionUser(user);
    setRejectionReason("");
    setCustomReason("");
    setShowCustomReason(false);
    setShowRejectModal(true);
  };

  const handleDeactivateUser = (user: User) => {
    setActionUser(user);
    setDeactivationReason("");
    setCustomReason("");
    setShowCustomReason(false);
    setShowDeactivateModal(true);
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
      fetchUsers(); // Refresh data
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
      fetchUsers(); // Refresh data
    } catch (error) {
      console.error("Failed to deactivate user:", error);
    }
  };

  const handleActivateUser = async (userId: number, activate: boolean) => {
    try {
      if (activate) {
        await adminApi.activateUser(userId);
        fetchUsers(); // Refresh data
      } else {
        // For deactivation, show modal to get reason
        const user = users.find(u => u.user_id === userId);
        if (user) {
          handleDeactivateUser(user);
        }
      }
    } catch (error) {
      console.error("Failed to update user status:", error);
    }
  };

  const viewUserDetails = async (user: User) => {
    try {
      const data = await adminApi.getUserById(user.user_id);
      setSelectedUser(data.user);
      setShowModal(true);
    } catch (error) {
      console.error("Failed to fetch user details:", error);
    }
  };

  // Filter users based on search and filter criteria
  const filteredUsers = users.filter(user => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        (user.first_name && user.first_name.toLowerCase().includes(searchLower)) ||
        (user.last_name && user.last_name.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.userName && user.userName.toLowerCase().includes(searchLower)) ||
        (user.phone_number && user.phone_number.includes(searchLower)) ||
        (user.user_location && user.user_location.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }
    
    // Verification status filter
    if (filters.verified !== undefined && user.is_verified !== filters.verified) {
      return false;
    }
    
    // Active status filter
    if (filters.active !== undefined && user.is_activated !== filters.active) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage customer accounts and verification status</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                <span className="text-sm text-blue-700">Total Users: </span>
                <span className="font-semibold text-blue-900">{users.length}</span>
              </div>
              <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                <span className="text-sm text-green-700">Filtered: </span>
                <span className="font-semibold text-green-900">{filteredUsers.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search users..."
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            value={filters.verified === undefined ? "" : filters.verified.toString()}
            onChange={(e) => setFilters({ ...filters, verified: e.target.value === "" ? undefined : e.target.value === "true" })}
          >
            <option value="">All Verification Status</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            value={filters.active === undefined ? "" : filters.active.toString()}
            onChange={(e) => setFilters({ ...filters, active: e.target.value === "" ? undefined : e.target.value === "true" })}
          >
            <option value="">All Active Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button
            onClick={fetchUsers}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Refresh
          </button>
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
                    Status
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
                {filteredUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <SmartImage
                            src={user.profile_photo}
                            alt={`${user.first_name} ${user.last_name}`}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover"
                            fallbackType="profile"
                            fallbackContent={
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {user.first_name[0]}{user.last_name[0]}
                                </span>
                              </div>
                            }
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
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
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_verified 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {user.is_verified ? "Verified" : "Unverified"}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_activated 
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {user.is_activated ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => viewUserDetails(user)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View
                      </button>
                      {!user.is_verified && (
                        <>
                          <button
                            onClick={() => handleVerifyUser(user.user_id)}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => handleRejectUser(user)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleActivateUser(user.user_id, !user.is_activated)}
                        className={`font-medium ${user.is_activated ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}`}
                      >
                        {user.is_activated ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredUsers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            {users.length === 0 ? "No users found." : "No users found matching your criteria."}
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-0 w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 max-w-2xl bg-white rounded-xl shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
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
            
            {/* Content */}
            <div className="p-6">
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
                    <div className="flex space-x-3 mt-2">
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        selectedUser.is_verified 
                          ? "bg-green-100 text-green-800" 
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {selectedUser.is_verified ? "✓ Verified" : "⚠ Unverified"}
                      </span>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        selectedUser.is_activated 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {selectedUser.is_activated ? "● Active" : "● Inactive"}
                      </span>
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

                {/* Valid ID Section */}
                {selectedUser.valid_id && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Valid ID Document</label>
                    <div className="flex justify-center">
                      <SmartImage
                        src={selectedUser.valid_id}
                        alt="User Valid ID"
                        width={400}
                        height={250}
                        className="border-2 border-gray-300 rounded-lg object-cover shadow-md max-w-full h-auto"
                        fallbackType="document"
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Close
                  </button>
                  {!selectedUser.is_verified && (
                    <button
                      onClick={() => {
                        handleVerifyUser(selectedUser.user_id);
                        setShowModal(false);
                      }}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Verify User
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Rejection Modal */}
      {showRejectModal && actionUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Reject User Verification</h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  You are rejecting the verification for: <strong>{actionUser.first_name} {actionUser.last_name}</strong>
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={showCustomReason ? "custom" : rejectionReason}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setShowCustomReason(true);
                        setRejectionReason("");
                      } else {
                        setShowCustomReason(false);
                        setRejectionReason(e.target.value);
                      }
                    }}
                  >
                    <option value="">Select a reason...</option>
                    {reasonsData.verificationRejection.map((reason: string, index: number) => (
                      <option key={index} value={reason}>
                        {reason}
                      </option>
                    ))}
                    <option value="custom">Other (specify custom reason)</option>
                  </select>
                </div>

                {showCustomReason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Rejection Reason
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      rows={3}
                      placeholder="Enter custom rejection reason..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRejectUser}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Reject User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Deactivation Modal */}
      {showDeactivateModal && actionUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Deactivate User</h3>
                <button
                  onClick={() => setShowDeactivateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  You are deactivating: <strong>{actionUser.first_name} {actionUser.last_name}</strong>
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deactivation Reason
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    value={showCustomReason ? "custom" : deactivationReason}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setShowCustomReason(true);
                        setDeactivationReason("");
                      } else {
                        setShowCustomReason(false);
                        setDeactivationReason(e.target.value);
                      }
                    }}
                  >
                    <option value="">Select a reason...</option>
                    {reasonsData.deactivationReasons.map((reason: string, index: number) => (
                      <option key={index} value={reason}>
                        {reason}
                      </option>
                    ))}
                    <option value="custom">Other (specify custom reason)</option>
                  </select>
                </div>

                {showCustomReason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Deactivation Reason
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      rows={3}
                      placeholder="Enter custom deactivation reason..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowDeactivateModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeactivateUser}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Deactivate User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
