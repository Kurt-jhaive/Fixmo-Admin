'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi, ServiceProvider, exportApi, getAdminName } from '@/lib/api';
import { SmartImage } from '@/components/SmartImage';
import { getImageUrl } from '@/lib/image-utils';
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

// Admin Name Display Component
function AdminName({ adminId }: { adminId: number | null | undefined }) {
  const [adminName, setAdminName] = useState<string>('Loading...');

  useEffect(() => {
    if (adminId) {
      getAdminName(adminId).then(setAdminName);
    } else {
      setAdminName('—');
    }
  }, [adminId]);

  return <span>{adminName}</span>;
}

export default function ServiceProvidersPage() {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all');
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  
  // Rejection/Deactivation Modal States
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [actionProvider, setActionProvider] = useState<ServiceProvider | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [deactivationReason, setDeactivationReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [showCustomReason, setShowCustomReason] = useState(false);

  // Export Modal States
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [exportFilters, setExportFilters] = useState({
    verification_status: '',
    provider_isActivated: '',
    provider_isVerified: '',
    start_date: '',
    end_date: ''
  });
  const [exporting, setExporting] = useState(false);

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      
      // Prepare filters for API call
      const filters: Record<string, string | boolean> = {};
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }
      if (filterStatus !== 'all') {
        if (filterStatus === 'verified') {
          filters.verified = true;
        } else if (filterStatus === 'pending') {
          filters.verified = false;
          filters.active = true;
        } else if (filterStatus === 'rejected') {
          filters.verified = false;
          filters.active = false;
        }
      }
      
      // Skip connection test and try real API directly
      console.log('🚀 Fetching service providers from real API with filters:', filters);
      const data = await adminApi.getProviders(filters);
      console.log('✅ Service Providers API Response:', data);
      
      setBackendStatus('connected');
      const providersArray = data.providers || data || [];
      console.log('👨‍🔧 Providers received:', providersArray.length);
      setProviders(providersArray);
    } catch (error) {
      console.error("❌ Failed to fetch service providers:", error);
      setBackendStatus('disconnected');
      
      // Use mock data as fallback
      console.warn('📋 Using mock data for service providers');
      setProviders([
        {
          provider_id: 1,
          provider_first_name: "Mike",
          provider_last_name: "Johnson",
          provider_email: "mike.johnson@example.com",
          provider_phone_number: "+1234567892",
          provider_profile_photo: "https://res.cloudinary.com/demo/image/upload/w_100,h_100,c_fill,g_face/v1/sample.jpg",
          provider_valid_id: "https://res.cloudinary.com/demo/image/upload/w_300,h_200,c_fit/v1/sample.jpg",
          provider_isVerified: true,
          created_at: new Date().toISOString(),
          provider_rating: 4.8,
          provider_location: "San Francisco",
          provider_uli: "SF12345",
          provider_userName: "mikej",
          provider_isActivated: true,
          provider_birthday: "1985-03-20",
          provider_exact_location: "789 Tech St, San Francisco"
        },
        {
          provider_id: 2,
          provider_first_name: "Sarah",
          provider_last_name: "Wilson",
          provider_email: "sarah.wilson@example.com",
          provider_phone_number: "+1234567893",
          provider_profile_photo: "https://res.cloudinary.com/demo/image/upload/w_100,h_100,c_fill,g_face/v1/woman.jpg",
          provider_valid_id: "https://res.cloudinary.com/demo/image/upload/w_300,h_200,c_fit/v1/sample.jpg",
          provider_isVerified: false,
          created_at: new Date().toISOString(),
          provider_rating: 4.2,
          provider_location: "Seattle",
          provider_uli: "SEA67890",
          provider_userName: "sarahw",
          provider_isActivated: true,
          provider_birthday: "1988-07-12",
          provider_exact_location: "321 Pine Ave, Seattle"
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleVerifyProvider = async (providerId: string) => {
    try {
      await adminApi.verifyProvider(providerId, true);
      await fetchProviders(); // Refresh the list
      setShowApproveModal(false);
      setActionProvider(null);
    } catch (error) {
      console.error('Error verifying provider:', error);
      alert(error instanceof Error ? error.message : 'Failed to approve provider');
    }
  };

  const handleApproveClick = (provider: ServiceProvider) => {
    setActionProvider(provider);
    setShowApproveModal(true);
  };

  const handleRejectProvider = (provider: ServiceProvider) => {
    setActionProvider(provider);
    setRejectionReason("");
    setCustomReason("");
    setShowCustomReason(false);
    setShowRejectModal(true);
  };

  const handleDeactivateProvider = (provider: ServiceProvider) => {
    setActionProvider(provider);
    setDeactivationReason("");
    setCustomReason("");
    setShowCustomReason(false);
    setShowDeactivateModal(true);
  };

  const confirmRejectProvider = async () => {
    if (!actionProvider) return;
    
    const finalReason = showCustomReason ? customReason : rejectionReason;
    if (!finalReason.trim()) {
      alert("Please select or enter a rejection reason");
      return;
    }

    try {
      await adminApi.rejectProvider(actionProvider.provider_id.toString(), finalReason);
      setShowRejectModal(false);
      setActionProvider(null);
      await fetchProviders(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting provider:', error);
    }
  };

  const confirmDeactivateProvider = async () => {
    if (!actionProvider) return;
    
    const finalReason = showCustomReason ? customReason : deactivationReason;
    if (!finalReason.trim()) {
      alert("Please select or enter a deactivation reason");
      return;
    }

    try {
      await adminApi.deactivateProvider(actionProvider.provider_id, finalReason);
      setShowDeactivateModal(false);
      setActionProvider(null);
      await fetchProviders(); // Refresh the list
    } catch (error) {
      console.error('Error deactivating provider:', error);
    }
  };

  const handleExport = async () => {
    if (!exportFormat) {
      alert('Please select an export format');
      return;
    }

    try {
      setExporting(true);

      // Build export parameters
      const exportParams: any = {
        format: exportFormat,
      };

      // Add filters if they have values
      if (exportFilters.verification_status) {
        exportParams.verification_status = exportFilters.verification_status;
      }
      if (exportFilters.provider_isActivated) {
        exportParams.provider_isActivated = exportFilters.provider_isActivated;
      }
      if (exportFilters.provider_isVerified) {
        exportParams.provider_isVerified = exportFilters.provider_isVerified;
      }
      if (exportFilters.start_date) {
        exportParams.start_date = exportFilters.start_date;
      }
      if (exportFilters.end_date) {
        exportParams.end_date = exportFilters.end_date;
      }
      if (searchTerm) {
        exportParams.search = searchTerm;
      }

      console.log('Exporting providers with params:', exportParams);
      
      // Call the export API
      const blob = await exportApi.exportProviders(exportParams);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `service-providers-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setShowExportModal(false);
      alert('Export completed successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export service providers. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleStatusChange = async (providerId: string, status: 'active' | 'inactive') => {
    try {
      if (status === 'active') {
        await adminApi.updateProviderStatus(providerId, status);
        await fetchProviders(); // Refresh the list
      } else {
        // For deactivation, show modal to get reason
        const provider = providers.find(p => p.provider_id.toString() === providerId);
        if (provider) {
          handleDeactivateProvider(provider);
        }
      }
    } catch (error) {
      console.error('Error updating provider status:', error);
    }
  };

  const viewProviderDetails = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setShowModal(true);
  };

  // Filter providers based on search term and status
  const filteredProviders = providers.filter(provider => {
    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${provider.provider_first_name || ''} ${provider.provider_last_name || ''}`.toLowerCase();
      const matchesSearch = 
        fullName.includes(searchLower) ||
        (provider.provider_email && provider.provider_email.toLowerCase().includes(searchLower)) ||
        (provider.provider_location && provider.provider_location.toLowerCase().includes(searchLower)) ||
        (provider.provider_uli && provider.provider_uli.toLowerCase().includes(searchLower)) ||
        (provider.provider_userName && provider.provider_userName.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'verified' && !provider.provider_isVerified) {
        return false;
      }
      if (filterStatus === 'pending' && (provider.provider_isVerified || !provider.provider_isActivated)) {
        return false;
      }
      if (filterStatus === 'rejected' && (provider.provider_isVerified || provider.provider_isActivated)) {
        return false;
      }
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Service Providers</h1>
              <p className="text-gray-600 mt-1">Manage and verify service providers on the platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                <span className="text-sm text-blue-700">Total Providers: </span>
                <span className="font-semibold text-blue-900">{providers.length}</span>
              </div>
              <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                <span className="text-sm text-green-700">Filtered: </span>
                <span className="font-semibold text-green-900">{filteredProviders.length}</span>
              </div>
              
              {/* Backend Status Indicator */}
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg border">
                <div className={`w-3 h-3 rounded-full ${
                  backendStatus === 'connected' ? 'bg-green-500' : 
                  backendStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  Backend: {backendStatus === 'connected' ? 'Connected' : 
                           backendStatus === 'disconnected' ? 'Disconnected (using mock data)' : 'Checking...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search providers by name, email, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'verified' | 'pending' | 'rejected')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white min-w-[140px]"
              >
                <option value="all" className="text-gray-900 bg-white">All Status</option>
                <option value="verified" className="text-gray-900 bg-white">Verified</option>
                <option value="pending" className="text-gray-900 bg-white">Pending</option>
                <option value="rejected" className="text-gray-900 bg-white">Rejected</option>
              </select>
            </div>
            <div>
              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 min-w-[120px]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Providers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Service Providers</h2>
            <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
              {filteredProviders.length} providers
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verified By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProviders.map((provider) => {
                const fullName = `${provider.provider_first_name} ${provider.provider_last_name}`;
                return (
                <tr key={provider.provider_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <SmartImage
                          src={provider.provider_profile_photo}
                          alt={fullName}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                          fallbackType="profile"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {fullName}
                        </div>
                        <div className="text-sm text-gray-500">{provider.provider_email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{provider.provider_uli || "—"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{provider.provider_location || "—"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900">{provider.provider_rating.toFixed(1)}</span>
                      <svg className="w-4 h-4 text-yellow-400 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      provider.provider_isActivated 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {provider.provider_isActivated ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      provider.provider_isVerified 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {provider.provider_isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {provider.verified_by_admin_id ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          <AdminName adminId={provider.verified_by_admin_id} />
                        </div>
                        {provider.verification_reviewed_at && (
                          <div className="text-xs text-gray-500">
                            {new Date(provider.verification_reviewed_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => viewProviderDetails(provider)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      View
                    </button>
                    {/* Show Approve/Reject only for unverified (pending) providers, but not for rejected */}
                    {!provider.provider_isVerified && provider.verification_status !== 'rejected' && (
                      <>
                        <button
                          onClick={() => handleApproveClick(provider)}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectProvider(provider)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {/* Show Activate/Deactivate for verified (approved) providers OR rejected providers */}
                    {(provider.provider_isVerified || provider.verification_status === 'rejected') && (
                      <button
                        onClick={() => handleStatusChange(provider.provider_id.toString(), provider.provider_isActivated ? 'inactive' : 'active')}
                        className={`font-medium ${provider.provider_isActivated ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}`}
                      >
                        {provider.provider_isActivated ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProviders.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {providers.length === 0 ? "No service providers found." : "No service providers found matching your criteria."}
            </div>
          )}
        </div>
      </div>

      {/* Provider Details Modal */}
      {showModal && selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Service Provider Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                        <p className="text-gray-900">{`${selectedProvider.provider_first_name} ${selectedProvider.provider_last_name}`}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900">{selectedProvider.provider_email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-gray-900">{selectedProvider.provider_phone_number}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Username</label>
                        <p className="text-gray-900">{selectedProvider.provider_userName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Rating</label>
                        <p className="text-gray-900">{selectedProvider.provider_rating.toFixed(1)} ⭐</p>
                      </div>
                      {selectedProvider.provider_birthday && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Birthday</label>
                          <p className="text-gray-900">{new Date(selectedProvider.provider_birthday).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">License/ID Number</label>
                        <p className="text-gray-900">{selectedProvider.provider_uli || 'Not provided'}</p>
                      </div>
                      {selectedProvider.provider_location && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Location</label>
                          <p className="text-gray-900">{selectedProvider.provider_location}</p>
                        </div>
                      )}
                      {selectedProvider.provider_exact_location && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Exact Location</label>
                          <p className="text-gray-900">{selectedProvider.provider_exact_location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Profile Photo</label>
                        <div className="relative group cursor-pointer inline-block">
                          <SmartImage
                            src={selectedProvider.provider_profile_photo}
                            alt="Profile"
                            width={128}
                            height={128}
                            className="w-32 h-32 object-cover rounded-lg border transition-all duration-200 group-hover:border-blue-500 group-hover:shadow-lg"
                            fallbackType="profile"
                            onClick={() => {
                              const imageUrl = selectedProvider.provider_profile_photo;
                              if (imageUrl) {
                                const processedUrl = getImageUrl(imageUrl);
                                if (processedUrl) {
                                  window.open(processedUrl, '_blank');
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                      {selectedProvider.provider_valid_id && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Valid ID</label>
                          <div className="relative group cursor-pointer inline-block">
                            <SmartImage
                              src={selectedProvider.provider_valid_id}
                              alt="Valid ID"
                              width={256}
                              height={160}
                              className="w-64 h-40 object-cover rounded-lg border transition-all duration-200 group-hover:border-blue-500 group-hover:shadow-lg"
                              fallbackType="document"
                              onClick={() => {
                                const imageUrl = selectedProvider.provider_valid_id;
                                if (imageUrl) {
                                  const processedUrl = getImageUrl(imageUrl);
                                  if (processedUrl) {
                                    window.open(processedUrl, '_blank');
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin Action Tracking */}
                  {(selectedProvider.verified_by_admin_id || selectedProvider.deactivated_by_admin_id) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                        </svg>
                        Admin Action History
                      </h3>
                      <div className="space-y-2 text-sm">
                        {selectedProvider.verified_by_admin_id && (
                          <div className="flex justify-between">
                            <span className="text-gray-700">Verified by:</span>
                            <span className="font-medium text-gray-900">
                              <AdminName adminId={selectedProvider.verified_by_admin_id} />
                            </span>
                          </div>
                        )}
                        {selectedProvider.verification_reviewed_at && (
                          <div className="flex justify-between">
                            <span className="text-gray-700">Reviewed at:</span>
                            <span className="font-medium text-gray-900">
                              {new Date(selectedProvider.verification_reviewed_at).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {selectedProvider.deactivated_by_admin_id && (
                          <div className="flex justify-between">
                            <span className="text-gray-700">Deactivated by:</span>
                            <span className="font-medium text-gray-900">
                              <AdminName adminId={selectedProvider.deactivated_by_admin_id} />
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t border-gray-200 bg-gray-50 -mx-6 px-6 pb-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Administrative Actions</h3>
                    <div className="grid grid-cols-1 gap-3">
                      {/* Verification Actions - Only for unverified (pending) providers */}
                      {!selectedProvider.provider_isVerified && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Verification Actions</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                setShowModal(false);
                                handleApproveClick(selectedProvider);
                              }}
                              className="flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                handleRejectProvider(selectedProvider);
                                setShowModal(false);
                              }}
                              className="flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Account Status Actions - Only for verified (approved) providers */}
                      {selectedProvider.provider_isVerified && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Account Status</h4>
                          <button
                            onClick={() => {
                              handleStatusChange(
                                selectedProvider.provider_id.toString(), 
                                selectedProvider.provider_isActivated ? 'inactive' : 'active'
                              );
                              setShowModal(false);
                            }}
                            className={`w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                              selectedProvider.provider_isActivated
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            {selectedProvider.provider_isActivated ? (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                </svg>
                                Deactivate Provider
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Activate Provider
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {providers.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No service providers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No service providers have been registered yet.'
              }
            </p>
          </div>
        </div>
      )}

      {/* Provider Approve Confirmation Modal */}
      {showApproveModal && actionProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">Approve Provider Verification</h3>
              <p className="text-sm text-gray-600 text-center mb-4">
                Are you sure you want to approve the verification for <strong>{actionProvider.provider_first_name} {actionProvider.provider_last_name}</strong>?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Email:</div>
                  <div className="font-medium">{actionProvider.provider_email}</div>
                  <div className="text-gray-600">Phone:</div>
                  <div className="font-medium">{actionProvider.provider_phone_number}</div>
                  <div className="text-gray-600">Username:</div>
                  <div className="font-medium">{actionProvider.provider_userName}</div>
                  <div className="text-gray-600">License ID:</div>
                  <div className="font-medium">{actionProvider.provider_uli || 'N/A'}</div>
                  <div className="text-gray-600">Location:</div>
                  <div className="font-medium">{actionProvider.provider_location || 'N/A'}</div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setActionProvider(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleVerifyProvider(actionProvider.provider_id.toString())}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Approve Verification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provider Rejection Modal */}
      {showRejectModal && actionProvider && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Reject Provider Verification</h3>
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  You are rejecting the verification for: <strong>{actionProvider.provider_first_name} {actionProvider.provider_last_name}</strong>
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
                    onClick={confirmRejectProvider}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Reject Provider
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provider Deactivation Modal */}
      {showDeactivateModal && actionProvider && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Deactivate Service Provider</h3>
                <button
                  onClick={() => setShowDeactivateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  You are deactivating: <strong>{actionProvider.provider_first_name} {actionProvider.provider_last_name}</strong>
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
                    onClick={confirmDeactivateProvider}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Deactivate Provider
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Export Service Providers</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setExportFormat('csv')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                      exportFormat === 'csv'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => setExportFormat('pdf')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                      exportFormat === 'pdf'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    PDF
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filters (Optional)</label>
                
                {/* Verification Status */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">Verification Status</label>
                  <select
                    value={exportFilters.verification_status}
                    onChange={(e) => setExportFilters({...exportFilters, verification_status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Activation Status */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">Active Status</label>
                  <select
                    value={exportFilters.provider_isActivated}
                    onChange={(e) => setExportFilters({...exportFilters, provider_isActivated: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="">All</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                {/* Verified Status */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">Verified Status</label>
                  <select
                    value={exportFilters.provider_isVerified}
                    onChange={(e) => setExportFilters({...exportFilters, provider_isVerified: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="">All</option>
                    <option value="true">Verified</option>
                    <option value="false">Not Verified</option>
                  </select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">From Date</label>
                    <input
                      type="date"
                      value={exportFilters.start_date}
                      onChange={(e) => setExportFilters({...exportFilters, start_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">To Date</label>
                    <input
                      type="date"
                      value={exportFilters.end_date}
                      onChange={(e) => setExportFilters({...exportFilters, end_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg">
              <button
                onClick={() => setShowExportModal(false)}
                disabled={exporting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {exporting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
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
