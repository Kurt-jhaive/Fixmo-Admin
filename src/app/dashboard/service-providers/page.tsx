"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi, exportApi, type ServiceProvider } from "@/lib/api";
import SmartImage from "@/components/SmartImage";
import KebabMenu, { KebabButton, type KebabMenuItem } from "@/components/ui/KebabMenu";
import ReviewProviderModal from "@/components/dashboard/ReviewProviderModal";
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

// Admin Name Display Component
function AdminName({ adminInfo }: { adminInfo?: { name: string; email: string } | null }) {
  if (!adminInfo) return <span>—</span>;
  return <span>{adminInfo.name}</span>;
}

// Admin Avatar Component
function AdminAvatar({ adminInfo }: { adminInfo?: { name: string; email: string } | null }) {
  if (!adminInfo) return <span>—</span>;

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return <span>{getInitials(adminInfo.name)}</span>;
}

// Helper function to get primary status
function getPrimaryStatus(provider: ServiceProvider): { label: string; color: string } {
  // Priority: Pending Verification > Deactivated > Rejected > Active
  if (!provider.provider_isVerified && provider.verification_status !== 'rejected') {
    return { label: 'Pending Verification', color: 'yellow' };
  }
  if (!provider.provider_isActivated) {
    return { label: 'Deactivated', color: 'red' };
  }
  if (provider.verification_status === 'rejected') {
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

export default function ServiceProvidersPage() {
  const { canEdit, canApprove } = useRBAC('serviceProviders');
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
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
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [actionProvider, setActionProvider] = useState<ServiceProvider | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [deactivationReason, setDeactivationReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [showCustomReason, setShowCustomReason] = useState(false);

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getProviders(filters);
      const providersArray = data.providers || data || [];
      setProviders(providersArray);
    } catch (error) {
      console.error("Failed to fetch providers:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const handleVerifyProvider = async (providerId: number) => {
    try {
      await adminApi.verifyProvider(providerId.toString(), true);
      fetchProviders();
      setShowReviewModal(false);
      setActionProvider(null);
      setOpenMenuId(null);
    } catch (error) {
      console.error("Failed to verify provider:", error);
      alert(error instanceof Error ? error.message : 'Failed to approve provider');
    }
  };

  const handleApproveClick = (provider: ServiceProvider) => {
    setActionProvider(provider);
    setShowReviewModal(true);
    setOpenMenuId(null);
  };

  const handleRejectProvider = (provider: ServiceProvider) => {
    setActionProvider(provider);
    setShowRejectModal(true);
    setOpenMenuId(null);
  };

  const handleDeactivateProvider = (provider: ServiceProvider) => {
    setActionProvider(provider);
    setShowDeactivateModal(true);
    setOpenMenuId(null);
  };

  const handleActivateProvider = async (providerId: number) => {
    if (!window.confirm("Are you sure you want to activate this provider account?")) {
      return;
    }
    try {
      await adminApi.activateProvider(providerId);
      fetchProviders();
      setOpenMenuId(null);
    } catch (error) {
      console.error("Failed to activate provider:", error);
      alert(error instanceof Error ? error.message : 'Failed to activate provider');
    }
  };

  const viewProviderDetails = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setShowModal(true);
    setOpenMenuId(null);
  };

  const submitRejection = async () => {
    if (!actionProvider) return;

    const finalReason = rejectionReason === "Other (please specify)" ? customReason : rejectionReason;
    
    if (!finalReason) {
      alert("Please select or enter a reason for rejection.");
      return;
    }

    try {
      await adminApi.rejectProvider(actionProvider.provider_id.toString(), finalReason);
      fetchProviders();
      setShowRejectModal(false);
      setActionProvider(null);
      setRejectionReason("");
      setCustomReason("");
      setShowCustomReason(false);
    } catch (error) {
      console.error("Failed to reject provider:", error);
      alert(error instanceof Error ? error.message : 'Failed to reject provider');
    }
  };

  const submitDeactivation = async () => {
    if (!actionProvider) return;

    const finalReason = deactivationReason === "Other (please specify)" ? customReason : deactivationReason;
    
    if (!finalReason) {
      alert("Please select or enter a reason for deactivation.");
      return;
    }

    try {
      await adminApi.deactivateProvider(actionProvider.provider_id, finalReason);
      fetchProviders();
      setShowDeactivateModal(false);
      setActionProvider(null);
      setDeactivationReason("");
      setCustomReason("");
      setShowCustomReason(false);
    } catch (error) {
      console.error("Failed to deactivate provider:", error);
      alert(error instanceof Error ? error.message : 'Failed to deactivate provider');
    }
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

      const blob = await exportApi.exportProviders(exportParams);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `service_providers_export_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
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

  const getKebabMenuItems = (provider: ServiceProvider): KebabMenuItem[] => {
    const isPending = !provider.provider_isVerified && provider.verification_status !== 'rejected';
    
    return [
      {
        label: 'View Profile',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ),
        onClick: () => viewProviderDetails(provider),
        variant: 'primary' as const,
      },
      {
        label: 'Verify Account',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        onClick: () => handleApproveClick(provider),
        variant: 'success' as const,
        hidden: !isPending || !canApprove,
      },
      {
        label: provider.provider_isActivated ? 'Deactivate Account' : 'Activate Account',
        icon: provider.provider_isActivated ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        onClick: () => {
          if (provider.provider_isActivated) {
            handleDeactivateProvider(provider);
          } else {
            handleActivateProvider(provider.provider_id);
          }
        },
        variant: provider.provider_isActivated ? 'danger' as const : 'success' as const,
        hidden: !canEdit,
      },
    ].filter(item => !item.hidden);
  };

  // Filter providers based on search and filters
  const filteredProviders = providers.filter((provider) => {
    const searchLower = filters.search.toLowerCase();
    const matchesSearch = 
      !filters.search ||
      `${provider.provider_first_name} ${provider.provider_last_name}`.toLowerCase().includes(searchLower) ||
      provider.provider_email.toLowerCase().includes(searchLower) ||
      provider.provider_location?.toLowerCase().includes(searchLower) ||
      provider.provider_uli?.toLowerCase().includes(searchLower);

    const matchesVerified = 
      filters.verified === undefined || 
      provider.provider_isVerified === filters.verified;

    const matchesActive = 
      filters.active === undefined || 
      provider.provider_isActivated === filters.active;

    return matchesSearch && matchesVerified && matchesActive;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <ViewOnlyBanner module="serviceProviders" />
      
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Provider Management</h1>
          <p className="text-gray-600 mt-1">Manage provider accounts and verification status</p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search providers..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>

          {/* Verification Status Filter */}
          <div>
            <select
              value={filters.verified === undefined ? 'all' : filters.verified ? 'verified' : 'unverified'}
              onChange={(e) => {
                const value = e.target.value;
                setFilters({
                  ...filters,
                  verified: value === 'all' ? undefined : value === 'verified'
                });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 min-w-[200px]"
            >
              <option value="all">All Verification Status</option>
              <option value="verified">Verified</option>
              <option value="unverified">Pending Verification</option>
            </select>
          </div>

          {/* Active Status Filter */}
          <div>
            <select
              value={filters.active === undefined ? 'all' : filters.active ? 'active' : 'inactive'}
              onChange={(e) => {
                const value = e.target.value;
                setFilters({
                  ...filters,
                  active: value === 'all' ? undefined : value === 'active'
                });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 min-w-[180px]"
            >
              <option value="all">All Active Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchProviders()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 min-w-[100px] justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading providers...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
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
                {filteredProviders.map((provider) => {
                  const primaryStatus = getPrimaryStatus(provider);
                  const businessName = `${provider.provider_first_name} ${provider.provider_last_name}`;
                  const username = provider.provider_userName;
                  
                  return (
                    <tr key={provider.provider_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <SmartImage
                              src={provider.provider_profile_photo}
                              alt={businessName}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-100"
                              fallbackType="profile"
                              fallbackContent={
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ring-2 ring-gray-100">
                                  <span className="text-sm font-semibold text-white">
                                    {provider.provider_first_name[0]}{provider.provider_last_name[0]}
                                  </span>
                                </div>
                              }
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {businessName}
                            </div>
                            <div className="text-sm text-gray-500">@{username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{provider.provider_email}</div>
                        <div className="text-sm text-gray-500">{provider.provider_phone_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 uppercase">
                          {provider.provider_location || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={primaryStatus} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {provider.verified_by_admin ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                              <AdminAvatar adminInfo={provider.verified_by_admin} />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 text-sm">
                                <AdminName adminInfo={provider.verified_by_admin} />
                              </span>
                              {provider.verification_reviewed_at && (
                                <span className="text-xs text-gray-500">
                                  {new Date(provider.verification_reviewed_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(provider.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                        <KebabButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === provider.provider_id ? null : provider.provider_id);
                          }}
                          isOpen={openMenuId === provider.provider_id}
                        />
                        <KebabMenu
                          items={getKebabMenuItems(provider)}
                          isOpen={openMenuId === provider.provider_id}
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

        {!loading && filteredProviders.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-lg font-medium text-gray-900">No providers found</p>
            <p className="mt-1 text-sm text-gray-500">
              {providers.length === 0 ? "No providers in the system yet." : "Try adjusting your filters."}
            </p>
          </div>
        )}
      </div>

      {/* Provider Details Modal */}
      {showModal && selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative mx-auto w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2 max-w-2xl bg-white rounded-xl shadow-2xl max-h-[95vh] overflow-hidden my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">Provider Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
              <div className="p-6 space-y-6">
                {/* Profile Photo */}
                <div className="flex justify-center">
                  <SmartImage
                    src={selectedProvider.provider_profile_photo}
                    alt={`${selectedProvider.provider_first_name} ${selectedProvider.provider_last_name}`}
                    width={120}
                    height={120}
                    className="w-32 h-32 rounded-full object-cover ring-4 ring-blue-100"
                    fallbackType="profile"
                  />
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">First Name</label>
                    <p className="mt-1 text-base text-gray-900">{selectedProvider.provider_first_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Name</label>
                    <p className="mt-1 text-base text-gray-900">{selectedProvider.provider_last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-base text-gray-900">{selectedProvider.provider_email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="mt-1 text-base text-gray-900">{selectedProvider.provider_phone_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="mt-1 text-base text-gray-900 uppercase">{selectedProvider.provider_location || "—"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Business Name</label>
                    <p className="mt-1 text-base text-gray-900">{selectedProvider.provider_first_name} {selectedProvider.provider_last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">License ID</label>
                    <p className="mt-1 text-base text-gray-900">{selectedProvider.provider_uli || "—"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Joined Date</label>
                    <p className="mt-1 text-base text-gray-900">
                      {new Date(selectedProvider.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Status Information */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Status Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Verification Status</label>
                      <p className="mt-1">
                        <StatusBadge status={getPrimaryStatus(selectedProvider)} />
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Account Status</label>
                      <p className="mt-1">
                        <StatusBadge status={{
                          label: selectedProvider.provider_isActivated ? 'Active' : 'Deactivated',
                          color: selectedProvider.provider_isActivated ? 'green' : 'red'
                        }} />
                      </p>
                    </div>
                  </div>
                </div>

                {/* Valid ID */}
                {selectedProvider.provider_valid_id && (
                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Valid ID</h4>
                    <SmartImage
                      src={selectedProvider.provider_valid_id}
                      alt="Valid ID"
                      width={400}
                      height={250}
                      className="w-full rounded-lg border border-gray-300"
                      fallbackType="document"
                    />
                  </div>
                )}

                {/* Admin Info */}
                {selectedProvider.verified_by_admin && (
                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Verification Details</h4>
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        <AdminAvatar adminInfo={selectedProvider.verified_by_admin} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          <AdminName adminInfo={selectedProvider.verified_by_admin} />
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedProvider.verified_by_admin.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Provider Verification Modal */}
      {showReviewModal && actionProvider && (
        <ReviewProviderModal
          isOpen={showReviewModal}
          provider={actionProvider}
          onApprove={() => handleVerifyProvider(actionProvider.provider_id)}
          onReject={() => {
            setShowReviewModal(false);
            handleRejectProvider(actionProvider);
          }}
          onClose={() => {
            setShowReviewModal(false);
            setActionProvider(null);
          }}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && actionProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Verification</h3>
            <p className="text-gray-600 mb-4">
              Rejecting verification for{" "}
              <span className="font-semibold">{actionProvider.provider_first_name} {actionProvider.provider_last_name}</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection *
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  setShowCustomReason(e.target.value === "Other (please specify)");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a reason...</option>
                {reasonsData.verificationRejection.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
                <option value="Other (please specify)">Other (please specify)</option>
              </select>
            </div>

            {showCustomReason && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please specify the reason *
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter the reason..."
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setActionProvider(null);
                  setRejectionReason("");
                  setCustomReason("");
                  setShowCustomReason(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitRejection}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Modal */}
      {showDeactivateModal && actionProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Deactivate Provider Account</h3>
            <p className="text-gray-600 mb-4">
              Deactivating account for{" "}
              <span className="font-semibold">{actionProvider.provider_first_name} {actionProvider.provider_last_name}</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Deactivation *
              </label>
              <select
                value={deactivationReason}
                onChange={(e) => {
                  setDeactivationReason(e.target.value);
                  setShowCustomReason(e.target.value === "Other (please specify)");
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a reason...</option>
                {reasonsData.deactivationReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
                <option value="Other (please specify)">Other (please specify)</option>
              </select>
            </div>

            {showCustomReason && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please specify the reason *
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter the reason..."
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setActionProvider(null);
                  setDeactivationReason("");
                  setCustomReason("");
                  setShowCustomReason(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitDeactivation}
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Service Providers</h3>
            
            <div className="space-y-4 mb-6">
              {/* Export Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verification Status</label>
                  <select
                    value={exportFilters.verification_status}
                    onChange={(e) => setExportFilters({ ...exportFilters, verification_status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Account Status</label>
                  <select
                    value={exportFilters.is_activated}
                    onChange={(e) => setExportFilters({ ...exportFilters, is_activated: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="true">Active</option>
                    <option value="false">Deactivated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={exportFilters.start_date}
                    onChange={(e) => setExportFilters({ ...exportFilters, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={exportFilters.end_date}
                    onChange={(e) => setExportFilters({ ...exportFilters, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
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
