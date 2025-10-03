'use client';

import { useState, useEffect } from 'react';
import { appointmentsApi } from '@/lib/api';

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
  appointment: Appointment;
  customer: {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  provider: {
    provider_id: number;
    provider_first_name: string;
    provider_last_name: string;
    provider_email: string;
  };
}

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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<number | null>(null);

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
      alert('Please provide a cancellation reason');
      return;
    }

    try {
      const response = await appointmentsApi.adminCancel(appointmentToCancel, {
        cancellation_reason: cancelReason,
        admin_notes: `Admin cancelled: ${cancelReason}`,
        cancelled_by: 'admin'
      });

      if (response.success) {
        alert('Appointment cancelled successfully');
        setShowCancelModal(false);
        setCancelReason('');
        setAppointmentToCancel(null);
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Failed to cancel appointment');
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

  const handleApproveDispute = async (backjobId: number) => {
    if (!confirm('Approve this dispute? This will mark the appointment as completed.')) {
      return;
    }

    try {
      const response = await appointmentsApi.updateBackjob(backjobId, {
        action: 'cancel-by-admin',
        admin_notes: 'Admin approved provider dispute. Appointment completed.'
      });

      if (response.success) {
        alert('Dispute approved. Appointment marked as completed.');
        fetchDisputedBackjobs();
      }
    } catch (error) {
      console.error('Error approving dispute:', error);
      alert('Failed to approve dispute');
    }
  };

  const handleRejectDispute = async (backjobId: number) => {
    if (!confirm('Reject this dispute? This will return the appointment to backjob status.')) {
      return;
    }

    try {
      const response = await appointmentsApi.updateBackjob(backjobId, {
        action: 'cancel-by-user',
        admin_notes: 'Admin rejected provider dispute. Backjob reinstated.'
      });

      if (response.success) {
        alert('Dispute rejected. Appointment returned to backjob status.');
        fetchDisputedBackjobs();
      }
    } catch (error) {
      console.error('Error rejecting dispute:', error);
      alert('Failed to reject dispute');
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
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => handleRejectDispute(backjob.backjob_id)}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Reject Dispute (Return to Backjob)
                    </button>
                    <button
                      onClick={() => handleApproveDispute(backjob.backjob_id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Approve Dispute (Complete Appointment)
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Cancellation Reason</h3>
                    <p className="text-sm text-gray-700">{selectedAppointment.cancellation_reason}</p>
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
              Please provide a reason for cancelling this appointment. This action cannot be undone.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setAppointmentToCancel(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCancelAppointment}
                disabled={!cancelReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
