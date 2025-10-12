  'use client';

  import { useState, useEffect } from 'react';
  import { appointmentsApi, exportApi } from '@/lib/api';

  interface Appointment {
    appointment_id: number;
    customer_id: number;
    provider_id: number;
    appointment_status: string;
    scheduled_date: string;
    created_at: string;
    final_price: number;
    repairDescription: string;
    warranty_days: number;
    finished_at: string | null;
    completed_at: string | null;
    warranty_expires_at: string | null;
    warranty_paused_at: string | null;
    warranty_remaining_days: number | null;
    cancellation_reason: string | null;
    cancelled_by_admin_id?: number;
    days_left: number | null;
    customer: {
      user_id: number;
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
    };
    serviceProvider: {
      provider_id: number;
      provider_first_name: string;
      provider_last_name: string;
      provider_email: string;
      provider_phone_number: string;
      provider_rating: number;
    };
    service: {
      service_title: string;
      service_startingprice: number;
    };
  }

  interface BackjobApplication {
    backjob_id: number;
    appointment_id: number;
    customer_id: number;
    provider_id: number;
    status: string;
    reason: string;
    evidence: any;
    provider_dispute_reason: string | null;
    provider_dispute_evidence: any;
    admin_notes: string | null;
    created_at: string;
    updated_at: string;
    appointment: {
      appointment_id: number;
      appointment_status: string;
      scheduled_date: string;
      final_price: number | null;
      repairDescription: string | null;
      warranty_days: number | null;
      warranty_expires_at: string | null;
      warranty_paused_at: string | null;
      warranty_remaining_days: number | null;
      service: {
        service_id: number;
        service_title: string;
        service_startingprice: number;
      };
    };
    customer: {
      user_id: number;
      first_name: string;
      last_name: string;
      email: string;
      phone_number?: string;
      user_location?: string;
    };
    provider: {
      provider_id: number;
      provider_first_name: string;
      provider_last_name: string;
      provider_email: string;
      provider_phone_number?: string;
      provider_location?: string;
      provider_uli?: string;
      provider_exact_location?: string;
    };
  }

  const CANCELLATION_REASONS = [
    "Customer no-show or unreachable",
    "Provider no-show or cancelled",
    "Fraudulent or suspicious activity",
    "Violation of platform terms of service",
    "Safety concerns reported",
    "Duplicate booking",
    "Service no longer needed by customer",
    "Location or access issues",
    "Payment dispute or fraud",
    "Inappropriate behavior from customer or provider",
    "Emergency situation",
    "Other (please specify in notes)"
  ];

  const APPROVE_DISPUTE_REASONS = [
    "Provider provided sufficient evidence of completed work",
    "Customer's claim does not match the evidence",
    "Issue is outside the scope of original service",
    "Customer caused the damage after service completion",
    "Provider followed all proper procedures",
    "Independent verification supports provider",
    "Customer's expectations were unreasonable",
    "Work was completed as specified in agreement",
    "Other (please specify in notes)"
  ];

  const REJECT_DISPUTE_REASONS = [
    "Customer's evidence clearly shows the issue",
    "Provider did not complete work to standard",
    "Issue is directly related to original service",
    "Provider's dispute lacks sufficient evidence",
    "Multiple similar complaints against provider",
    "Work does not meet industry standards",
    "Provider's explanation is inconsistent",
    "Warranty claim is valid and justified",
    "Other (please specify in notes)"
  ];

  export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [backjobs, setBackjobs] = useState<BackjobApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'appointments' | 'disputes'>('appointments');
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [selectedBackjob, setSelectedBackjob] = useState<BackjobApplication | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [cancelReason, setCancelReason] = useState('');
    const [customCancelReason, setCustomCancelReason] = useState('');
    const [showCustomCancelReason, setShowCustomCancelReason] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState<number | null>(null);
    
    // Dispute modal states
    const [showApproveDisputeModal, setShowApproveDisputeModal] = useState(false);
    const [showRejectDisputeModal, setShowRejectDisputeModal] = useState(false);
    const [backjobToResolve, setBackjobToResolve] = useState<number | null>(null);
    const [disputeReason, setDisputeReason] = useState('');
    const [customDisputeReason, setCustomDisputeReason] = useState('');
    const [showCustomDisputeReason, setShowCustomDisputeReason] = useState(false);

    // Export Modal States
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
    const [exportFilters, setExportFilters] = useState({
      appointment_status: '',
      customer_id: '',
      provider_id: '',
      start_date: '',
      end_date: ''
    });
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
      if (activeTab === 'appointments') {
        fetchAppointments();
      } else {
        fetchDisputedBackjobs();
      }
    }, [activeTab, statusFilter, currentPage]);

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const params: any = {
          page: currentPage,
          limit: 20,
        };
        
        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }

        const response = await appointmentsApi.getAll(params);
        if (response.success) {
          setAppointments(response.data);
          setTotalPages(response.pagination.total_pages);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchDisputedBackjobs = async () => {
      try {
        setLoading(true);
        console.log('Fetching disputed backjobs...');
        const response = await appointmentsApi.getBackjobs({ 
          status: 'disputed',
          page: currentPage,
          limit: 20 
        });
        console.log('Backjobs response:', response);
        if (response.success) {
          setBackjobs(response.data || []);
          if (response.pagination) {
            setTotalPages(response.pagination.total_pages);
          }
        }
      } catch (error: any) {
        console.error('Error fetching backjobs:', error);
        alert(`Failed to load disputed backjobs: ${error.message}`);
        setBackjobs([]);
      } finally {
        setLoading(false);
      }
    };

    const handleCancelAppointment = async () => {
      if (!appointmentToCancel || !cancelReason.trim()) {
        alert('Please select a cancellation reason');
        return;
      }

      if (showCustomCancelReason && !customCancelReason.trim()) {
        alert('Please provide custom cancellation reason');
        return;
      }

      const finalReason = showCustomCancelReason ? customCancelReason : cancelReason;

      try {
        const response = await appointmentsApi.adminCancel(appointmentToCancel, {
          cancellation_reason: finalReason,
          admin_notes: `Admin cancelled: ${finalReason}`,
          cancelled_by: 'admin'
        });

        if (response.success) {
          alert('Appointment cancelled successfully');
          setShowCancelModal(false);
          setCancelReason('');
          setCustomCancelReason('');
          setShowCustomCancelReason(false);
          setAppointmentToCancel(null);
          fetchAppointments();
        }
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        alert('Failed to cancel appointment');
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
        if (exportFilters.appointment_status) {
          exportParams.appointment_status = exportFilters.appointment_status;
        }
        if (exportFilters.customer_id) {
          exportParams.customer_id = exportFilters.customer_id;
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

        console.log('Exporting appointments with params:', exportParams);
        
        // Call the export API
        const blob = await exportApi.exportAppointments(exportParams);
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `appointments-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setShowExportModal(false);
        alert('Export completed successfully!');
      } catch (error) {
        console.error('Export error:', error);
        alert('Failed to export appointments. Please try again.');
      } finally {
        setExporting(false);
      }
    };

    const openCancelModal = (appointmentId: number, status: string) => {
      // Check if appointment can be cancelled
      const cannotCancel = ['completed', 'cancelled', 'backjob'].includes(status);
      if (cannotCancel) {
        alert(`Cannot cancel appointment with status: ${status}`);
        return;
      }

      setAppointmentToCancel(appointmentId);
      setShowCancelModal(true);
    };

    const openApproveDisputeModal = (backjobId: number) => {
      setBackjobToResolve(backjobId);
      setShowApproveDisputeModal(true);
    };

    const openRejectDisputeModal = (backjobId: number) => {
      setBackjobToResolve(backjobId);
      setShowRejectDisputeModal(true);
    };

    const handleApproveDispute = async () => {
      if (!backjobToResolve || !disputeReason.trim()) {
        alert('Please select a reason for approving the dispute');
        return;
      }

      if (showCustomDisputeReason && !customDisputeReason.trim()) {
        alert('Please provide custom reason');
        return;
      }

      const finalReason = showCustomDisputeReason ? customDisputeReason : disputeReason;

      try {
        const response = await appointmentsApi.approveDispute(backjobToResolve, finalReason.trim());

        if (response.success) {
          alert('Dispute approved successfully!\n\n' + response.message);
          setShowApproveDisputeModal(false);
          setDisputeReason('');
          setCustomDisputeReason('');
          setShowCustomDisputeReason(false);
          setBackjobToResolve(null);
          fetchDisputedBackjobs();
        }
      } catch (error: any) {
        console.error('Error approving dispute:', error);
        alert(`Failed to approve dispute: ${error.message}`);
      }
    };

    const handleRejectDispute = async () => {
      if (!backjobToResolve || !disputeReason.trim()) {
        alert('Please select a reason for rejecting the dispute');
        return;
      }

      if (showCustomDisputeReason && !customDisputeReason.trim()) {
        alert('Please provide custom reason');
        return;
      }

      const finalReason = showCustomDisputeReason ? customDisputeReason : disputeReason;

      try {
        const response = await appointmentsApi.rejectDispute(backjobToResolve, finalReason.trim());

        if (response.success) {
          alert('Dispute rejected successfully!\n\n' + response.message);
          setShowRejectDisputeModal(false);
          setDisputeReason('');
          setCustomDisputeReason('');
          setShowCustomDisputeReason(false);
          setBackjobToResolve(null);
          fetchDisputedBackjobs();
        }
      } catch (error: any) {
        console.error('Error rejecting dispute:', error);
        alert(`Failed to reject dispute: ${error.message}`);
      }
    };

    const getStatusColor = (status: string) => {
      const colors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        accepted: 'bg-blue-100 text-blue-800',
        scheduled: 'bg-purple-100 text-purple-800',
        'on-the-way': 'bg-indigo-100 text-indigo-800',
        'in-progress': 'bg-orange-100 text-orange-800',
        finished: 'bg-cyan-100 text-cyan-800',
        completed: 'bg-green-100 text-green-800',
        'in-warranty': 'bg-emerald-100 text-emerald-800',
        backjob: 'bg-amber-100 text-amber-800',
        disputed: 'bg-red-100 text-red-800',
        cancelled: 'bg-gray-100 text-gray-800',
        expired: 'bg-slate-100 text-slate-800',
      };
      return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const filteredAppointments = appointments.filter(apt => {
      const searchLower = searchTerm.toLowerCase();
      return (
        apt.customer.first_name.toLowerCase().includes(searchLower) ||
        apt.customer.last_name.toLowerCase().includes(searchLower) ||
        apt.serviceProvider.provider_first_name.toLowerCase().includes(searchLower) ||
        apt.serviceProvider.provider_last_name.toLowerCase().includes(searchLower) ||
        apt.service.service_title.toLowerCase().includes(searchLower) ||
        apt.appointment_id.toString().includes(searchLower)
      );
    });

    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Appointment Management</h1>
          <p className="text-gray-600 mt-2">Manage appointments and resolve disputes</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'appointments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Appointments
            </button>
            <button
              onClick={() => setActiveTab('disputes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'disputes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Disputed Backjobs
              {backjobs.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                  {backjobs.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {activeTab === 'appointments' ? (
          <>
            {/* Filters and Search */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Search by customer, provider, service, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="scheduled">Scheduled</option>
                <option value="on-the-way">On The Way</option>
                <option value="in-progress">In Progress</option>
                <option value="finished">Finished</option>
                <option value="completed">Completed</option>
                <option value="in-warranty">In Warranty</option>
                <option value="backjob">Backjob</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            </div>

            {/* Appointments Table */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading appointments...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No appointments found</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Provider
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cancelled By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAppointments.map((appointment) => (
                        <tr key={appointment.appointment_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{appointment.appointment_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.customer.first_name} {appointment.customer.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{appointment.customer.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.serviceProvider.provider_first_name}{' '}
                              {appointment.serviceProvider.provider_last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ⭐ {appointment.serviceProvider.provider_rating?.toFixed(1) || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{appointment.service.service_title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(appointment.scheduled_date).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                appointment.appointment_status
                              )}`}
                            >
                              {appointment.appointment_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₱{appointment.final_price?.toFixed(2) || appointment.service.service_startingprice.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {appointment.cancelled_by_admin_id ? (
                              <div className="text-sm font-medium text-gray-900">
                                Admin ID: {appointment.cancelled_by_admin_id}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => setSelectedAppointment(appointment)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </button>
                            {!['completed', 'cancelled', 'backjob'].includes(appointment.appointment_status) && (
                              <button
                                onClick={() => openCancelModal(appointment.appointment_id, appointment.appointment_status)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Page <span className="font-medium">{currentPage}</span> of{' '}
                          <span className="font-medium">{totalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Disputed Backjobs */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading disputed backjobs...</p>
              </div>
            ) : backjobs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500">No disputed backjobs found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {backjobs.map((backjob) => (
                  <div key={backjob.backjob_id} className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          Backjob #{backjob.backjob_id} - Appointment #{backjob.appointment_id}
                        </h3>
                        <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Disputed
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Created: {new Date(backjob.created_at).toLocaleString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Customer Information */}
                      <div className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Customer Claim</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Name:</span> {backjob.customer.first_name}{' '}
                          {backjob.customer.last_name}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Email:</span> {backjob.customer.email}
                        </p>
                        {backjob.customer.user_location && (
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Location:</span> {backjob.customer.user_location}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Reason:</span> {backjob.reason}
                        </p>
                        {backjob.evidence && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700 mb-1">Evidence:</p>
                            {backjob.evidence.description && (
                              <p className="text-sm text-gray-600 mb-2">{backjob.evidence.description}</p>
                            )}
                            {backjob.evidence.files && backjob.evidence.files.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {backjob.evidence.files.map((file: string, idx: number) => (
                                  <a
                                    key={idx}
                                    href={file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                                  >
                                    View Evidence {idx + 1}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Provider Dispute */}
                      <div className="border-l-4 border-orange-500 pl-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Provider Dispute</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Name:</span> {backjob.provider.provider_first_name}{' '}
                          {backjob.provider.provider_last_name}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Email:</span> {backjob.provider.provider_email}
                        </p>
                        {backjob.provider.provider_uli && (
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">ULI:</span> {backjob.provider.provider_uli}
                          </p>
                        )}
                        {backjob.provider.provider_location && (
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Location:</span> {backjob.provider.provider_location}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Dispute Reason:</span>{' '}
                          {backjob.provider_dispute_reason || 'N/A'}
                        </p>
                        {backjob.provider_dispute_evidence && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700 mb-1">Dispute Evidence:</p>
                            {backjob.provider_dispute_evidence.description && (
                              <p className="text-sm text-gray-600 mb-2">
                                {backjob.provider_dispute_evidence.description}
                              </p>
                            )}
                            {backjob.provider_dispute_evidence.files &&
                              backjob.provider_dispute_evidence.files.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {backjob.provider_dispute_evidence.files.map((file: string, idx: number) => (
                                    <a
                                      key={idx}
                                      href={file}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-orange-600 hover:text-orange-800 text-sm underline"
                                    >
                                      View Evidence {idx + 1}
                                    </a>
                                  ))}
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Appointment Details</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Service:</span>
                          <p className="font-medium">{backjob.appointment.service.service_title}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Price:</span>
                          <p className="font-medium">
                            ₱
                            {backjob.appointment.final_price?.toFixed(2) ||
                              backjob.appointment.service.service_startingprice.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <p className="font-medium">{backjob.appointment.appointment_status}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Warranty Days:</span>
                          <p className="font-medium">{backjob.appointment.warranty_days || 0} days</p>
                        </div>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    <div className="flex flex-wrap justify-end gap-3">
                      <button
                        onClick={() => openRejectDisputeModal(backjob.backjob_id)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200"
                        title="Reject provider's dispute - backjob remains active, provider must reschedule"
                      >
                        ⚠️ Reject Dispute (Side with Customer)
                      </button>
                      <button
                        onClick={() => openApproveDisputeModal(backjob.backjob_id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                        title="Approve provider's dispute - backjob will be automatically approved and warranty resumed"
                      >
                        ✅ Approve Dispute (Side with Provider)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Appointment Details Modal */}
        {selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Appointment Details #{selectedAppointment.appointment_id}
                  </h2>
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status and Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <span
                        className={`mt-1 px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(
                          selectedAppointment.appointment_status
                        )}`}
                      >
                        {selectedAppointment.appointment_status}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Scheduled Date</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedAppointment.scheduled_date).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-gray-600">Name</label>
                        <p className="font-medium">
                          {selectedAppointment.customer.first_name} {selectedAppointment.customer.last_name}
                        </p>
                      </div>
                      <div>
                        <label className="text-gray-600">Email</label>
                        <p className="font-medium">{selectedAppointment.customer.email}</p>
                      </div>
                      <div>
                        <label className="text-gray-600">Phone</label>
                        <p className="font-medium">{selectedAppointment.customer.phone_number}</p>
                      </div>
                    </div>
                  </div>

                  {/* Provider Information */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Provider Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-gray-600">Name</label>
                        <p className="font-medium">
                          {selectedAppointment.serviceProvider.provider_first_name}{' '}
                          {selectedAppointment.serviceProvider.provider_last_name}
                        </p>
                      </div>
                      <div>
                        <label className="text-gray-600">Email</label>
                        <p className="font-medium">{selectedAppointment.serviceProvider.provider_email}</p>
                      </div>
                      <div>
                        <label className="text-gray-600">Phone</label>
                        <p className="font-medium">{selectedAppointment.serviceProvider.provider_phone_number}</p>
                      </div>
                      <div>
                        <label className="text-gray-600">Rating</label>
                        <p className="font-medium">
                          ⭐ {selectedAppointment.serviceProvider.provider_rating?.toFixed(1) || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Service Details */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-gray-600">Service</label>
                        <p className="font-medium">{selectedAppointment.service.service_title}</p>
                      </div>
                      <div>
                        <label className="text-gray-600">Price</label>
                        <p className="font-medium">
                          ₱
                          {selectedAppointment.final_price?.toFixed(2) ||
                            selectedAppointment.service.service_startingprice.toFixed(2)}
                        </p>
                      </div>
                      {selectedAppointment.repairDescription && (
                        <div className="col-span-2">
                          <label className="text-gray-600">Description</label>
                          <p className="font-medium">{selectedAppointment.repairDescription}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Warranty Information */}
                  {selectedAppointment.warranty_days > 0 && (
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Warranty Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="text-gray-600">Warranty Period</label>
                          <p className="font-medium">{selectedAppointment.warranty_days} days</p>
                        </div>
                        {selectedAppointment.warranty_expires_at && (
                          <div>
                            <label className="text-gray-600">Expires At</label>
                            <p className="font-medium">
                              {new Date(selectedAppointment.warranty_expires_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {selectedAppointment.days_left !== null && (
                          <div>
                            <label className="text-gray-600">Days Remaining</label>
                            <p className="font-medium">{selectedAppointment.days_left} days</p>
                          </div>
                        )}
                        {selectedAppointment.warranty_paused_at && (
                          <div>
                            <label className="text-gray-600">Warranty Status</label>
                            <p className="font-medium text-yellow-600">
                              Paused ({selectedAppointment.warranty_remaining_days} days remaining)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cancellation Reason */}
                  {selectedAppointment.cancellation_reason && (
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Cancellation Information</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <label className="text-gray-600">Reason</label>
                          <p className="font-medium text-gray-900">{selectedAppointment.cancellation_reason}</p>
                        </div>
                        {selectedAppointment.cancelled_by_admin_id && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
                            <label className="text-gray-700 font-medium">Cancelled by Admin ID:</label>
                            <p className="text-blue-900 font-semibold">{selectedAppointment.cancelled_by_admin_id}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Appointment Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Appointment</h3>
              <p className="text-gray-600 mb-4">
                Please select a reason for cancelling this appointment. This action cannot be undone.
              </p>
              
              {/* Dropdown for cancellation reasons */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Cancellation Reason *
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCancelReason(value);
                    setShowCustomCancelReason(value === 'Other (please specify in notes)');
                    if (value !== 'Other (please specify in notes)') {
                      setCustomCancelReason('');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Select a reason --</option>
                  {CANCELLATION_REASONS.map((reason, index) => (
                    <option key={index} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom reason textarea (shown when "Other" is selected) */}
              {showCustomCancelReason && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Please specify the reason *
                  </label>
                  <textarea
                    value={customCancelReason}
                    onChange={(e) => setCustomCancelReason(e.target.value)}
                    placeholder="Enter custom cancellation reason..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                    setCustomCancelReason('');
                    setShowCustomCancelReason(false);
                    setAppointmentToCancel(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCancelAppointment}
                  disabled={!cancelReason.trim() || (showCustomCancelReason && !customCancelReason.trim())}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approve Dispute Modal */}
        {showApproveDisputeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <div className="bg-gradient-to-r from-green-600 to-green-700 -m-6 mb-6 px-6 py-4 rounded-t-lg">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Approve Provider's Dispute
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                This will <strong>cancel the customer's backjob request</strong> and <strong>resume their warranty</strong>. 
                Please select a reason for approving the provider's dispute.
              </p>
              
              {/* Dropdown for reasons */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Reason for Approval *
                </label>
                <select
                  value={disputeReason}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDisputeReason(value);
                    setShowCustomDisputeReason(value === 'Other (please specify in notes)');
                    if (value !== 'Other (please specify in notes)') {
                      setCustomDisputeReason('');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">-- Select a reason --</option>
                  {APPROVE_DISPUTE_REASONS.map((reason, index) => (
                    <option key={index} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom reason textarea */}
              {showCustomDisputeReason && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Please specify the reason *
                  </label>
                  <textarea
                    value={customDisputeReason}
                    onChange={(e) => setCustomDisputeReason(e.target.value)}
                    placeholder="Enter custom reason..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowApproveDisputeModal(false);
                    setDisputeReason('');
                    setCustomDisputeReason('');
                    setShowCustomDisputeReason(false);
                    setBackjobToResolve(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveDispute}
                  disabled={!disputeReason.trim() || (showCustomDisputeReason && !customDisputeReason.trim())}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Approval
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Dispute Modal */}
        {showRejectDisputeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 -m-6 mb-6 px-6 py-4 rounded-t-lg">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Reject Provider's Dispute
                </h3>
              </div>
              <p className="text-gray-600 mb-4">
                This will <strong>keep the customer's backjob request active</strong> and <strong>require the provider to reschedule</strong>. 
                Please select a reason for rejecting the provider's dispute.
              </p>
              
              {/* Dropdown for reasons */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Reason for Rejection *
                </label>
                <select
                  value={disputeReason}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDisputeReason(value);
                    setShowCustomDisputeReason(value === 'Other (please specify in notes)');
                    if (value !== 'Other (please specify in notes)') {
                      setCustomDisputeReason('');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">-- Select a reason --</option>
                  {REJECT_DISPUTE_REASONS.map((reason, index) => (
                    <option key={index} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom reason textarea */}
              {showCustomDisputeReason && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Please specify the reason *
                  </label>
                  <textarea
                    value={customDisputeReason}
                    onChange={(e) => setCustomDisputeReason(e.target.value)}
                    placeholder="Enter custom reason..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRejectDisputeModal(false);
                    setDisputeReason('');
                    setCustomDisputeReason('');
                    setShowCustomDisputeReason(false);
                    setBackjobToResolve(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectDispute}
                  disabled={!disputeReason.trim() || (showCustomDisputeReason && !customDisputeReason.trim())}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Export Appointments</h3>
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
                  
                  {/* Appointment Status */}
                  <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">Appointment Status</label>
                    <select
                      value={exportFilters.appointment_status}
                      onChange={(e) => setExportFilters({...exportFilters, appointment_status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    >
                      <option value="">All</option>
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="in-progress">In Progress</option>
                      <option value="finished">Finished</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
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
