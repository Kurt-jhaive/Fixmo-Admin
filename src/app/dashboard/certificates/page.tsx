"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi, type Certificate, exportApi, getAdminName, authApi } from "@/lib/api";
import { getImageUrl } from "@/lib/image-utils";
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

interface CertificateWithProvider extends Certificate {
  provider_name: string;
  certificate_type: string;
  issue_date: string;
  verified_by?: string;
  verification_date?: string;
  rejection_reason?: string;
}

const getStatusBadge = (status: string) => {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  switch (status.toLowerCase()) {
    case "approved":
    case "valid":
      return `${baseClasses} bg-green-100 text-green-800`;
    case "pending":
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case "expired":
      return `${baseClasses} bg-orange-100 text-orange-800`;
    case "rejected":
      return `${baseClasses} bg-red-100 text-red-800`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};

const isExpiringSoon = (expiryDate?: string) => {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  return expiry <= thirtyDaysFromNow && expiry > now;
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

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateWithProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
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
      setError(null);
      
      // Prepare filters for API call
      const filters: Record<string, string> = {};
      if (filter !== "all") {
        filters.status = filter;
      }
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }
      
      const data = await adminApi.getCertificates(filters);
      setCertificates(data.certificates || data || []);
    } catch (err) {
      console.error('Error fetching certificates:', err);
      setError('Failed to load certificates. Using mock data for demonstration.');
      // Fallback to mock data if API fails
      setCertificates([
        {
          certificate_id: 1,
          certificate_name: "General Contractor License",
          certificate_number: "GCL-2024-001",
          certificate_status: "approved",
          provider_id: 1,
          created_at: "2024-01-15T00:00:00Z",
          expiry_date: "2025-01-15",
          certificate_file_path: "https://res.cloudinary.com/demo/image/upload/sample.jpg", // Example Cloudinary URL
          provider_name: "ABC Repair Services",
          certificate_type: "General Contractor License",
          issue_date: "2024-01-15",
          verified_by: "Admin Sarah",
          verification_date: "2024-01-16",
        },
        {
          certificate_id: 2,
          certificate_name: "Plumbing License",
          certificate_number: "PL-2024-002",
          certificate_status: "pending",
          provider_id: 2,
          created_at: "2024-03-10T00:00:00Z",
          expiry_date: "2025-03-10",
          certificate_file_path: "/uploads/certificates/plumbing-license.pdf", // Example relative path
          provider_name: "QuickFix Plumbing",
          certificate_type: "Plumbing License",
          issue_date: "2024-03-10",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleCertificateAction = async (certId: number, action: "approve" | "reject", reason?: string) => {
    try {
      if (action === "approve") {
        await adminApi.approveCertificate(certId);
        alert('Certificate approved successfully!');
      } else if (action === "reject" && reason) {
        await adminApi.rejectCertificate(certId, reason);
        alert('Certificate rejected successfully!');
      }
      // Refresh the certificates list
      await fetchCertificates();
      setSelectedCertificate(null);
      setApprovalConfirm(null);
      setRejectionReason("");
      setCustomReason("");
      setShowCustomReason(false);
    } catch (error) {
      console.error(`Error ${action}ing certificate:`, error);
      alert(`Failed to ${action} certificate. Please try again.`);
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

      console.log('Exporting certificates with params:', exportParams);
      
      // Call the export API
      const blob = await exportApi.exportCertificates(exportParams);
      
      // Create download link
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

  const handleViewDocument = (certificate: CertificateWithProvider) => {
    // Check for certificate_file_path first, then fallback to certificate_photo
    const documentPath = certificate.certificate_file_path;;
    
    if (documentPath) {
      const documentUrl = getImageUrl(documentPath);
      
      if (documentUrl) {
        console.log('Opening document URL:', documentUrl);
        window.open(documentUrl, '_blank');
      } else {
        console.warn('Invalid document URL for certificate:', certificate);
        alert('Invalid document URL for this certificate.');
      }
    } else {
      console.warn('No document available for certificate:', certificate);
      alert('No document available for this certificate.');
    }
  };

  // Filter certificates based on search term and filter
  const filteredCertificates = certificates.filter(certificate => {
    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (certificate.provider_name && certificate.provider_name.toLowerCase().includes(searchLower)) ||
        (certificate.certificate_name && certificate.certificate_name.toLowerCase().includes(searchLower)) ||
        (certificate.certificate_type && certificate.certificate_type.toLowerCase().includes(searchLower)) ||
        (certificate.certificate_status && certificate.certificate_status.toLowerCase().includes(searchLower)) ||
        (certificate.certificate_number && certificate.certificate_number.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (filter !== 'all') {
      if (filter === 'pending' && certificate.certificate_status !== 'pending') {
        return false;
      }
      if (filter === 'approved' && !['approved', 'valid'].includes(certificate.certificate_status)) {
        return false;
      }
      if (filter === 'expired' && certificate.certificate_status !== 'expired') {
        return false;
      }
      if (filter === 'expiring' && !isExpiringSoon(certificate.expiry_date)) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Certificate Management</h1>
          <p className="text-gray-600 mt-2">
            Review and verify service provider certifications and licenses.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Total Certificates</div>
          <div className="text-2xl font-bold text-gray-900">{certificates.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Filtered Results</div>
          <div className="text-2xl font-bold text-blue-600">{filteredCertificates.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Pending Review</div>
          <div className="text-2xl font-bold text-yellow-600">
            {certificates.filter(c => c.certificate_status === "pending").length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Expiring Soon</div>
          <div className="text-2xl font-bold text-orange-600">
            {certificates.filter(c => isExpiringSoon(c.expiry_date)).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Valid</div>
          <div className="text-2xl font-bold text-green-600">
            {certificates.filter(c => c.certificate_status === "approved" || c.certificate_status === "valid").length}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div>
            <input
              type="text"
              placeholder="Search by provider name, certificate type, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Certificates</option>
              <option value="pending">Pending Review</option>
              <option value="expiring">Expiring Soon</option>
              <option value="expired">Expired</option>
              <option value="approved">Approved</option>
            </select>
          </div>
          <div>
            <button
              onClick={fetchCertificates}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Refresh
            </button>
          </div>
          {isSuperAdmin && (
            <div>
              <button
                onClick={() => setShowExportModal(true)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Certificates Table */}      {/* Certificates Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Certificates ({filteredCertificates.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider & Certificate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Certificate Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
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
              {filteredCertificates.map((certificate) => (
                <tr key={certificate.certificate_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{certificate.provider_name}</div>
                      <div className="text-sm text-gray-500">{certificate.certificate_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900">{certificate.certificate_number || "—"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(certificate.certificate_status)}>
                      {certificate.certificate_status}
                    </span>
                    {isExpiringSoon(certificate.expiry_date) && certificate.certificate_status === "approved" && (
                      <div className="text-xs text-orange-600 mt-1">Expiring soon!</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {certificate.issue_date ? new Date(certificate.issue_date).toLocaleDateString() : new Date(certificate.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {certificate.expiry_date ? new Date(certificate.expiry_date).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {certificate.reviewed_by_admin_id ? (
                        <AdminName adminId={certificate.reviewed_by_admin_id} />
                      ) : (
                        certificate.verified_by || "—"
                      )}
                    </div>
                    {certificate.reviewed_at && (
                      <div className="text-xs text-gray-500">
                        {new Date(certificate.reviewed_at).toLocaleDateString()}
                      </div>
                    )}
                    {!certificate.reviewed_at && certificate.verification_date && (
                      <div className="text-xs text-gray-500">
                        {new Date(certificate.verification_date).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      {(certificate.certificate_file_path) ? (
                        <button 
                          onClick={() => handleViewDocument(certificate)}
                          className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-colors"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Document
                        </button>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-gray-500 bg-gray-100">
                          No Document
                        </span>
                      )}
                      {certificate.certificate_status?.toLowerCase() === "pending" && (
                        <>
                          <button
                            onClick={() => setApprovalConfirm({
                              id: certificate.certificate_id,
                              providerName: certificate.provider_name,
                              certificateType: certificate.certificate_name
                            })}
                            className="inline-flex items-center px-3 py-1.5 border border-green-300 text-xs font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 hover:border-green-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-all duration-200"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve
                          </button>
                          <button
                            onClick={() => setSelectedCertificate({
                              id: certificate.certificate_id,
                              providerName: certificate.provider_name,
                              certificateType: certificate.certificate_name,
                              status: certificate.certificate_status
                            })}
                            className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 hover:border-red-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all duration-200"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCertificates.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {certificates.length === 0 ? "No certificates found." : "No certificates found matching your criteria."}
            </div>
          )}
        </div>
      </div>

      {/* Approval Confirmation Modal */}
      {approvalConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 rounded-t-lg">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Approve Certificate
              </h3>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 mb-3">
                    Are you sure you want to approve this certificate?
                  </p>
                  <div className="bg-gray-50 rounded-md p-3 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium text-gray-900">Provider:</span>
                      <span className="text-gray-600 ml-2">{approvalConfirm.providerName}</span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-900">Certificate:</span>
                      <span className="text-gray-600 ml-2">{approvalConfirm.certificateType}</span>
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    This action will verify the certificate and allow the provider to offer services.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => setApprovalConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleCertificateAction(approvalConfirm.id, "approve");
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
              >
                Yes, Approve Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-lg">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Reject Certificate
              </h3>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="text-sm text-gray-600">
                <p className="mb-2">
                  <span className="font-medium">Provider:</span> {selectedCertificate.providerName}
                </p>
                <p className="mb-4">
                  <span className="font-medium">Certificate:</span> {selectedCertificate.certificateType}
                </p>
                <p>Please provide a reason for rejecting this certificate:</p>
              </div>
              
              {/* Predefined Reasons Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Select Reason
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    setShowCustomReason(e.target.value === "custom");
                    if (e.target.value !== "custom") {
                      setCustomReason("");
                    }
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white"
                >
                  <option value="">Select a reason...</option>
                  {reasonsData.certificateRejection.map((reason: string, index: number) => (
                    <option key={index} value={reason}>
                      {reason}
                    </option>
                  ))}
                  <option value="custom">Other (Custom Reason)</option>
                </select>
              </div>

              {/* Custom Reason Input */}
              {showCustomReason && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Custom Reason
                  </label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={3}
                    placeholder="Enter custom rejection reason..."
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedCertificate(null);
                  setRejectionReason("");
                  setCustomReason("");
                  setShowCustomReason(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const finalReason = showCustomReason ? customReason : rejectionReason;
                  handleCertificateAction(selectedCertificate.id, "reject", finalReason);
                }}
                disabled={!rejectionReason || (showCustomReason && !customReason.trim())}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 hover:shadow-lg disabled:bg-red-400 disabled:cursor-not-allowed disabled:hover:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
              >
                Reject Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading certificates...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Export Certificates</h3>
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
                
                {/* Certificate Status */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">Certificate Status</label>
                  <select
                    value={exportFilters.certificate_status}
                    onChange={(e) => setExportFilters({...exportFilters, certificate_status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
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
