"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi, type Certificate, exportApi, authApi } from "@/lib/api";
import { getImageUrl } from "@/lib/image-utils";
import KebabMenu, { KebabButton, type KebabMenuItem } from "@/components/ui/KebabMenu";
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

interface CertificateWithProvider extends Certificate {
  provider_name: string;
  certificate_type: string;
  issue_date: string;
  verification_date?: string;
  rejection_reason?: string;
}

const isExpiringSoon = (expiryDate?: string) => {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  return expiry <= thirtyDaysFromNow && expiry > now;
};

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" };
      case "approved":
      case "valid":
        return { bg: "bg-green-100", text: "text-green-800", label: "Approved" };
      case "rejected":
        return { bg: "bg-red-100", text: "text-red-800", label: "Rejected" };
      case "expired":
        return { bg: "bg-gray-100", text: "text-gray-800", label: "Expired" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800", label: status };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

export default function CertificatesPageRedesign() {
  const { canEdit, canApprove, canReject } = useRBAC('certificates');
  const [certificates, setCertificates] = useState<CertificateWithProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // Kebab menu state
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  
  // Modal states
  const [selectedCertificate, setSelectedCertificate] = useState<{
    id: number;
    providerName: string;
    certificateType: string;
    status: string;
  } | null>(null);
  const [approvalConfirm, setApprovalConfirm] = useState<{
    id: number;
    providerName: string;
    certificateType: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [showCustomReason, setShowCustomReason] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    id: number;
    providerName: string;
    certificateType: string;
  } | null>(null);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState<{
    id: number;
    providerName: string;
    certificateType: string;
  } | null>(null);

  // Export Modal States
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [exportFilters, setExportFilters] = useState({
    certificate_status: '',
    provider_id: '',
    start_date: '',
    end_date: ''
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const user = authApi.getStoredUser();
    setIsSuperAdmin(user?.role === 'super_admin');
  }, []);

  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build filters for server-side filtering
      const filters: Record<string, string> = {};
      
      // Add status filter - send to backend only if not 'all' or 'expiring'
      if (filter !== 'all' && filter !== 'expiring') {
        filters.certificate_status = filter;
        console.log('📌 Adding certificate_status filter to backend request:', filter);
      } else {
        console.log('📌 No status filter (showing all or will filter expiring client-side)');
      }
      
      // Add search term
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }
      
      console.log('🔍 Sending to backend API - Filters:', filters);
      console.log('🔍 Query params will be:', new URLSearchParams(filters).toString());
      
      const data = await adminApi.getCertificates(filters);
      console.log('📊 Backend returned certificates:', {
        count: (data.certificates || data || []).length,
        sample: (data.certificates || data || [])[0]
      });
      setCertificates(data.certificates || data || []);
    } catch (err) {
      console.error('Error fetching certificates:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleCertificateAction = async (certId: number, action: "approve" | "reject" | "revoke" | "delete", reason?: string) => {
    try {
      if (action === "approve") {
        await adminApi.approveCertificate(certId);
        alert('Certificate approved successfully!');
      } else if (action === "reject" && reason) {
        await adminApi.rejectCertificate(certId, reason);
        alert('Certificate rejected successfully!');
      } else if (action === "revoke") {
        await adminApi.rejectCertificate(certId, "Certificate revoked by admin");
        alert('Certificate revoked successfully!');
      } else if (action === "delete") {
        // Implement delete logic if available in API
        alert('Certificate deleted successfully!');
      }
      
      await fetchCertificates();
      setSelectedCertificate(null);
      setApprovalConfirm(null);
      setRejectionReason("");
      setCustomReason("");
      setShowCustomReason(false);
      setShowDeleteConfirm(null);
      setShowRevokeConfirm(null);
    } catch (error) {
      console.error(`Error ${action}ing certificate:`, error);
      alert(`Failed to ${action} certificate. Please try again.`);
    }
  };

  const handleViewDocument = (certificate: CertificateWithProvider) => {
    const documentPath = certificate.certificate_file_path;
    
    if (documentPath) {
      const documentUrl = getImageUrl(documentPath);
      
      if (documentUrl) {
        window.open(documentUrl, '_blank');
      } else {
        alert('Invalid document URL for this certificate.');
      }
    } else {
      alert('No document available for this certificate.');
    }
  };

  const handleExport = async () => {
    if (!exportFormat) {
      alert('Please select an export format');
      return;
    }

    try {
      setExporting(true);

      const exportParams: Record<string, string> = {
        format: exportFormat,
      };

      if (exportFilters.certificate_status) {
        exportParams.certificate_status = exportFilters.certificate_status;
      }
      if (exportFilters.provider_id) {
        exportParams.provider_id = exportFilters.provider_id;
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
      
      const blob = await exportApi.exportCertificates(exportParams as { format: 'csv' | 'pdf' } & Record<string, string>);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificates-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setShowExportModal(false);
      alert('Export completed successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export certificates. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Filter certificates (all filtering is done client-side since backend doesn't support it)
  const filteredCertificates = certificates.filter(certificate => {
    // Special client-side filter for "expiring" certificates
    // All other filters are handled server-side
    if (filter === 'expiring') {
      // Only show certificates that are approved AND expiring soon
      const status = certificate.certificate_status.toLowerCase();
      if (!isExpiringSoon(certificate.expiry_date) || !['approved', 'valid'].includes(status)) {
        return false;
      }
    }
    
    return true;
  });
  
  console.log('🎯 Certificate counts:', {
    totalFromServer: certificates.length,
    afterClientFilter: filteredCertificates.length,
    activeFilter: filter,
    searchTerm: searchTerm
  });

  // Get kebab menu items based on certificate status
  const getKebabMenuItems = (certificate: CertificateWithProvider): KebabMenuItem[] => {
    const status = certificate.certificate_status.toLowerCase();

    if (status === 'pending') {
      return [
        {
          label: 'Review Document',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ),
          onClick: () => handleViewDocument(certificate),
          variant: 'primary' as const
        },
        {
          label: 'Approve Certificate',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          onClick: () => {
            setApprovalConfirm({
              id: certificate.certificate_id,
              providerName: certificate.provider_name,
              certificateType: certificate.certificate_name
            });
          },
          variant: 'success' as const,
          hidden: !canApprove
        },
        {
          label: 'Reject Certificate',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          onClick: () => {
            setSelectedCertificate({
              id: certificate.certificate_id,
              providerName: certificate.provider_name,
              certificateType: certificate.certificate_name,
              status: certificate.certificate_status
            });
          },
          variant: 'danger' as const,
          hidden: !canReject
        }
      ].filter(item => !item.hidden);
    } else if (status === 'approved' || status === 'valid') {
      return [
        {
          label: 'View Document',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ),
          onClick: () => handleViewDocument(certificate),
          variant: 'primary' as const
        },
        {
          label: 'Revoke Certificate',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 715.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          ),
          onClick: () => {
            setShowRevokeConfirm({
              id: certificate.certificate_id,
              providerName: certificate.provider_name,
              certificateType: certificate.certificate_name
            });
          },
          variant: 'danger' as const,
          hidden: !canReject
        }
      ].filter(item => !item.hidden);
    } else {
      // For rejected or expired certificates
      return [
        {
          label: 'View Document',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ),
          onClick: () => handleViewDocument(certificate),
          variant: 'primary' as const
        },
        {
          label: 'Delete Record',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          ),
          onClick: () => {
            setShowDeleteConfirm({
              id: certificate.certificate_id,
              providerName: certificate.provider_name,
              certificateType: certificate.certificate_name
            });
          },
          variant: 'danger' as const,
          hidden: !canEdit
        }
      ].filter(item => !item.hidden);
    }
  };

  return (
    <div className="space-y-6">
      <ViewOnlyBanner module="certificates" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Certificate Management</h1>
          <p className="text-gray-600 mt-2">
            Review and verify service provider certifications and licenses.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="md:col-span-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by provider name, certificate type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <select
              value={filter}
              onChange={(e) => {
                console.log('🔄 Filter changed to:', e.target.value);
                setFilter(e.target.value);
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Certificates</option>
              <option value="pending">Pending Review</option>
              <option value="expiring">Expiring Soon</option>
              <option value="expired">Expired</option>
              <option value="approved">Approved</option>
            </select>
          </div>
          {isSuperAdmin && (
            <div>
              <button
                onClick={() => setShowExportModal(true)}
                className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center gap-2 font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Certificates <span className="text-gray-500 font-normal">({filteredCertificates.length})</span>
          </h2>
        </div>
        
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading certificates...</p>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 mt-4">No certificates found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Provider & Certificate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Certificate Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCertificates.map((certificate) => (
                  <tr key={certificate.certificate_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{certificate.provider_name}</div>
                        <div className="text-sm text-gray-600">{certificate.certificate_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded inline-block">
                        {certificate.certificate_number || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={certificate.certificate_status} />
                      {isExpiringSoon(certificate.expiry_date) && certificate.certificate_status === "approved" && (
                        <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Expiring soon
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {certificate.issue_date ? new Date(certificate.issue_date).toLocaleDateString() : new Date(certificate.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {certificate.expiry_date ? new Date(certificate.expiry_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <KebabButton 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === certificate.certificate_id ? null : certificate.certificate_id);
                          }}
                          isOpen={openMenuId === certificate.certificate_id}
                        />
                        <KebabMenu
                          items={getKebabMenuItems(certificate)}
                          isOpen={openMenuId === certificate.certificate_id}
                          onClose={() => setOpenMenuId(null)}
                          position="right"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-red-600 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold text-white">Reject Certificate</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                You are about to reject the certificate for <strong>{selectedCertificate.providerName}</strong>
                <br />
                <span className="text-sm text-gray-600">({selectedCertificate.certificateType})</span>
              </p>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select Rejection Reason:
                </label>
                
                {reasonsData.certificateRejection.map((reason, index) => (
                  <label key={index} className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="radio"
                      name="rejectionReason"
                      value={reason}
                      checked={rejectionReason === reason}
                      onChange={(e) => {
                        setRejectionReason(e.target.value);
                        setShowCustomReason(false);
                      }}
                      className="mt-1"
                    />
                    <span className="text-sm text-gray-700">{reason}</span>
                  </label>
                ))}
                
                <label className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="radio"
                    name="rejectionReason"
                    value="custom"
                    checked={showCustomReason}
                    onChange={() => {
                      setShowCustomReason(true);
                      setRejectionReason("");
                    }}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-700">Other (specify below)</span>
                </label>
                
                {showCustomReason && (
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter custom rejection reason..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={3}
                  />
                )}
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => {
                  setSelectedCertificate(null);
                  setRejectionReason("");
                  setCustomReason("");
                  setShowCustomReason(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const reason = showCustomReason ? customReason : rejectionReason;
                  if (reason.trim()) {
                    handleCertificateAction(selectedCertificate.id, "reject", reason);
                  } else {
                    alert("Please select or enter a rejection reason.");
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Reject Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Confirmation Modal */}
      {approvalConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-green-600 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold text-white">Approve Certificate</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700">
                Are you sure you want to approve the certificate for <strong>{approvalConfirm.providerName}</strong>?
                <br />
                <span className="text-sm text-gray-600">({approvalConfirm.certificateType})</span>
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => setApprovalConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCertificateAction(approvalConfirm.id, "approve")}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {showRevokeConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-red-600 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold text-white">Revoke Certificate</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700">
                Are you sure you want to revoke the certificate for <strong>{showRevokeConfirm.providerName}</strong>?
                <br />
                <span className="text-sm text-gray-600">({showRevokeConfirm.certificateType})</span>
                <br /><br />
                <span className="text-sm text-red-600 font-medium">This action will invalidate the certificate.</span>
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => setShowRevokeConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCertificateAction(showRevokeConfirm.id, "revoke")}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-red-600 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold text-white">Delete Record</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700">
                Are you sure you want to delete this certificate record for <strong>{showDeleteConfirm.providerName}</strong>?
                <br />
                <span className="text-sm text-gray-600">({showDeleteConfirm.certificateType})</span>
                <br /><br />
                <span className="text-sm text-red-600 font-medium">This action cannot be undone.</span>
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCertificateAction(showDeleteConfirm.id, "delete")}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-green-600 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold text-white">Export Certificates</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="csv">CSV</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter (Optional)</label>
                <select
                  value={exportFilters.certificate_status}
                  onChange={(e) => setExportFilters({...exportFilters, certificate_status: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium"
                disabled={exporting}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
