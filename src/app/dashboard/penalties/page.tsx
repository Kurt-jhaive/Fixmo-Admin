'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { penaltyApi, type PenaltyViolation, type RestrictedAccount, type PenaltyAdjustmentLog, type PenaltyDashboardStats } from '@/lib/api';
import reasonsData from '@/../REASONS.json';
import PenaltyDashboardRedesign from '@/components/dashboard/penalty-dashboard-redesign';
import KebabMenu, { KebabButton } from '@/components/ui/KebabMenu';
import AdjustPointsModal, { type AdjustmentData } from '@/components/dashboard/AdjustPointsModal';
import ReviewAppealModal, { type AppealReviewData } from '@/components/dashboard/ReviewAppealModal';

export default function PenaltiesPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'violations' | 'appeals' | 'restricted' | 'logs'>('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Dashboard
  const [dashboardStats, setDashboardStats] = useState<PenaltyDashboardStats | null>(null);
  
  // Violations
  const [violations, setViolations] = useState<PenaltyViolation[]>([]);
  const [violationSearchTerm, setViolationSearchTerm] = useState('');
  const [selectedViolation, setSelectedViolation] = useState<PenaltyViolation | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState<number | null>(null);
  const [showViolationDetailsModal, setShowViolationDetailsModal] = useState(false);
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [customDismissReason, setCustomDismissReason] = useState('');
  
  // Appeals
  const [appeals, setAppeals] = useState<PenaltyViolation[]>([]);
  const [selectedAppeal, setSelectedAppeal] = useState<PenaltyViolation | null>(null);
  const [showAppealModal, setShowAppealModal] = useState(false);
  
  // Restricted Accounts
  const [restrictedUsers] = useState<RestrictedAccount[]>([]);
  const [restrictedProviders] = useState<RestrictedAccount[]>([]);
  
  // Adjustment Logs
  const [adjustmentLogs, setAdjustmentLogs] = useState<PenaltyAdjustmentLog[]>([]);
  const [logsSearchTerm, setLogsSearchTerm] = useState('');
  const [logsTypeFilter, setLogsTypeFilter] = useState('all');
  const [logsAdminFilter, setLogsAdminFilter] = useState('all');
  const [logsDateFilter, setLogsDateFilter] = useState('all');
  const [error, setError] = useState<string>('');
  
  // Modals
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  
  // Suspension Form
  const [suspensionForm, setSuspensionForm] = useState({
    userId: '',
    providerId: '',
    action: 'suspend' as 'suspend' | 'lift',
    reason: '',
    suspensionDays: ''
  });
  
  // Reset Form
  const [resetForm, setResetForm] = useState({
    userId: '',
    providerId: '',
    reason: '',
    resetValue: '100'
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      if (activeTab === 'dashboard') {
        const response = await penaltyApi.getDashboardStats();
        setDashboardStats(response.data);
      } else if (activeTab === 'violations') {
        const response = await penaltyApi.getViolations({ limit: 100 });
        console.log('Violations response:', response);
        console.log('Sample violation:', response.data.violations[0]);
        setViolations(response.data.violations || []);
      } else if (activeTab === 'appeals') {
        const response = await penaltyApi.getPendingAppeals();
        setAppeals(response.data);
      } else if (activeTab === 'logs') {
        try {
          const response = await penaltyApi.getAdjustmentLogs({ limit: 50 });
          console.log('Adjustment logs response:', response);
          
          // Handle different response structures
          if (response.success && response.data) {
            setAdjustmentLogs(Array.isArray(response.data.logs) ? response.data.logs : []);
          } else if (Array.isArray(response.data)) {
            // In case backend returns data directly
            setAdjustmentLogs(response.data);
          } else {
            console.warn('Unexpected response structure:', response);
            setAdjustmentLogs([]);
          }
        } catch (logError) {
          const error = logError as Error;
          console.error('Error fetching adjustment logs:', error);
          setError(`Unable to load adjustment logs: ${error.message || 'Unknown error'}`);
          setAdjustmentLogs([]);
        }
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdjustPoints = async (adjustmentData: AdjustmentData) => {
    try {
      const data: {
        points: number;
        adjustmentType: 'add' | 'deduct';
        reason: string;
        userId?: number;
        providerId?: number;
      } = {
        points: adjustmentData.points,
        adjustmentType: adjustmentData.actionType,
        reason: adjustmentData.reason
      };
      
      if (adjustmentData.accountType === 'user') {
        data.userId = adjustmentData.accountId;
      } else {
        data.providerId = adjustmentData.accountId;
      }
      
      await penaltyApi.adjustPoints(data);
      alert('Points adjusted successfully!');
      setShowAdjustModal(false);
      fetchData();
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Failed to adjust points');
    }
  };

  const handleManageSuspension = async () => {
    try {
      const data: {
        action: 'suspend' | 'lift';
        reason: string;
        userId?: number;
        providerId?: number;
        suspensionDays?: number;
      } = {
        action: suspensionForm.action as 'suspend' | 'lift',
        reason: suspensionForm.reason
      };
      
      if (suspensionForm.userId) data.userId = parseInt(suspensionForm.userId);
      if (suspensionForm.providerId) data.providerId = parseInt(suspensionForm.providerId);
      if (suspensionForm.suspensionDays) data.suspensionDays = parseInt(suspensionForm.suspensionDays);
      
      await penaltyApi.manageSuspension(data);
      alert('Suspension managed successfully!');
      setShowSuspensionModal(false);
      setSuspensionForm({ userId: '', providerId: '', action: 'suspend', reason: '', suspensionDays: '' });
      fetchData();
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Failed to manage suspension');
    }
  };

  const handleResetPoints = async () => {
    try {
      const data: {
        reason: string;
        resetValue: number;
        userId?: number;
        providerId?: number;
      } = {
        reason: resetForm.reason,
        resetValue: parseInt(resetForm.resetValue)
      };
      
      if (resetForm.userId) data.userId = parseInt(resetForm.userId);
      if (resetForm.providerId) data.providerId = parseInt(resetForm.providerId);
      
      await penaltyApi.resetPoints(data);
      alert('Points reset successfully!');
      setShowResetModal(false);
      setResetForm({ userId: '', providerId: '', reason: '', resetValue: '100' });
      fetchData();
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Failed to reset points');
    }
  };

  const handleReviewAppeal = async (reviewData: AppealReviewData) => {
    if (!selectedAppeal) return;
    
    try {
      await penaltyApi.reviewAppeal(selectedAppeal.violation_id, {
        approved: reviewData.decision === 'approve',
        reviewNotes: reviewData.reason
      });
      alert(`Appeal ${reviewData.decision === 'approve' ? 'approved' : 'rejected'} successfully!`);
      setShowAppealModal(false);
      setSelectedAppeal(null);
      fetchData();
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Failed to review appeal');
    }
  };

  const handleDismissViolation = async () => {
    // Get the final reason - either selected predefined or custom
    const finalReason = dismissReason === 'Other' ? customDismissReason : dismissReason;
    
    if (!selectedViolation || !finalReason || finalReason.length < 10) {
      alert('Please provide a reason (minimum 10 characters)');
      return;
    }
    
    try {
      await penaltyApi.dismissViolation(selectedViolation.violation_id, finalReason);
      alert('Violation dismissed successfully! Points have been restored.');
      setShowDismissModal(false);
      setSelectedViolation(null);
      setDismissReason('');
      setCustomDismissReason('');
      fetchData();
    } catch (err) {
      const error = err as Error;
      alert(error.message || 'Failed to dismiss violation');
    }
  };

  // handleViewDetails is intentionally unused - kept for future feature
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleViewDetails = async (violation: PenaltyViolation) => {
    try {
      const response = await penaltyApi.getViolationDetails(violation.violation_id);
      setSelectedViolation(response.data);
      setShowViolationDetailsModal(true);
    } catch (err) {
      console.error('Error fetching violation details:', err);
      // Fallback to showing current data if API fails
      setSelectedViolation(violation);
      setShowViolationDetailsModal(true);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-red-100 text-red-800',
      appealed: 'bg-yellow-100 text-yellow-800',
      reversed: 'bg-green-100 text-green-800',
      dismissed: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Filter violations based on search term
  const filteredViolations = violations.filter(violation => {
    if (!violationSearchTerm) return true;
    
    const searchLower = violationSearchTerm.toLowerCase();
    const violationName = (violation.violation_name || violation.violation_type?.violation_name || '').toLowerCase();
    const violationCode = (violation.violation_code || violation.violation_type?.violation_code || '').toLowerCase();
    const userName = violation.user ? `${violation.user.first_name} ${violation.user.last_name}`.toLowerCase() : '';
    const providerName = violation.provider ? `${violation.provider.provider_first_name} ${violation.provider.provider_last_name}`.toLowerCase() : '';
    const userId = violation.user_id?.toString() || '';
    const providerId = violation.provider_id?.toString() || '';
    const violationId = violation.violation_id.toString();
    
    return violationName.includes(searchLower) ||
           violationCode.includes(searchLower) ||
           userName.includes(searchLower) ||
           providerName.includes(searchLower) ||
           userId.includes(searchLower) ||
           providerId.includes(searchLower) ||
           violationId.includes(searchLower);
  });

  // Filter adjustment logs
  const filteredLogs = adjustmentLogs.filter((log) => {
    const searchLower = logsSearchTerm.toLowerCase();
    const accountText = log.user_id ? `User #${log.user_id}` : `Provider #${log.provider_id}`;
    const adminText = log.adjusted_by_admin?.name || log.adjusted_by_admin?.admin_name || 'System';
    const reasonText = log.reason || '';
    
    const matchesSearch = accountText.toLowerCase().includes(searchLower) ||
                         adminText.toLowerCase().includes(searchLower) ||
                         reasonText.toLowerCase().includes(searchLower);
    
    const matchesType = logsTypeFilter === 'all' || log.adjustment_type === logsTypeFilter;
    const matchesAdmin = logsAdminFilter === 'all' || adminText === logsAdminFilter;
    
    let matchesDate = true;
    if (logsDateFilter !== 'all') {
      const logDate = new Date(log.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (logsDateFilter === '7days') matchesDate = daysDiff <= 7;
      else if (logsDateFilter === '30days') matchesDate = daysDiff <= 30;
      else if (logsDateFilter === '90days') matchesDate = daysDiff <= 90;
    }
    
    return matchesSearch && matchesType && matchesAdmin && matchesDate;
  });

  // Get unique admins for filter
  const uniqueAdmins = Array.from(new Set(adjustmentLogs.map(log => log.adjusted_by_admin?.name || log.adjusted_by_admin?.admin_name || 'System')));

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Penalty Management</h1>
          <p className="text-gray-600 mt-2">Monitor and manage the penalty point system</p>
        </div>

        {/* Adjust Points Button */}
        <div>
          <button
            onClick={() => setShowAdjustModal(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Adjust Points
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['dashboard', 'violations', 'appeals', 'logs'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'dashboard' | 'violations' | 'appeals' | 'logs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-all duration-200 ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 transform scale-105'
                  : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:transform hover:scale-105'
              }`}
            >
              {tab === 'logs' ? 'Adjustment Logs' : tab}
              {tab === 'appeals' && appeals.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                  {appeals.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                onClick={() => {
                  setError('');
                  fetchData();
                }}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && dashboardStats && (
            <PenaltyDashboardRedesign
              dashboardStats={dashboardStats}
              appeals={appeals}
              restrictedUsers={restrictedUsers}
              restrictedProviders={restrictedProviders}
              setActiveTab={setActiveTab}
            />
          )}

          {/* Violations Tab */}
          {activeTab === 'violations' && (
            <div>
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search violations, users, or providers..."
                    value={violationSearchTerm}
                    onChange={(e) => setViolationSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Violations Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User/Provider</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Violation</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredViolations.map((violation) => (
                      <tr key={violation.violation_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{violation.violation_id}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {violation.user && (
                            <div>
                              <div className="flex items-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                  USER
                                </span>
                                <span className="font-medium text-gray-900">
                                  {violation.user.first_name} {violation.user.last_name}
                                </span>
                              </div>
                              <div className="text-gray-500 mt-1">ID: {violation.user.user_id}</div>
                            </div>
                          )}
                          {!violation.user && violation.user_id && (
                            <div>
                              <div className="flex items-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                  USER
                                </span>
                                <span className="font-medium text-gray-900">User</span>
                              </div>
                              <div className="text-gray-500 mt-1">ID: {violation.user_id}</div>
                            </div>
                          )}
                          {violation.provider && (
                            <div>
                              <div className="flex items-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                                  PROVIDER
                                </span>
                                <span className="font-medium text-gray-900">
                                  {violation.provider.provider_first_name} {violation.provider.provider_last_name}
                                </span>
                              </div>
                              <div className="text-gray-500 mt-1">ID: {violation.provider.provider_id}</div>
                            </div>
                          )}
                          {!violation.provider && violation.provider_id && (
                            <div>
                              <div className="flex items-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                                  PROVIDER
                                </span>
                                <span className="font-medium text-gray-900">Provider</span>
                              </div>
                              <div className="text-gray-500 mt-1">ID: {violation.provider_id}</div>
                            </div>
                          )}
                          {!violation.user && !violation.user_id && !violation.provider && !violation.provider_id && (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-gray-900">
                            {violation.violation_name || violation.violation_type?.violation_name || 'Unknown Violation'}
                          </div>
                          <div className="text-gray-500 text-xs mt-1">
                            {violation.violation_code || violation.violation_type?.violation_code || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                          -{violation.penalty_points_deducted || violation.points_deducted || violation.violation_type?.penalty_points || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(violation.status)}`}>
                            {violation.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(violation.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="relative inline-block text-left">
                            <KebabButton
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowActionsMenu(showActionsMenu === violation.violation_id ? null : violation.violation_id);
                              }}
                              isOpen={showActionsMenu === violation.violation_id}
                            />
                            
                            <KebabMenu
                              isOpen={showActionsMenu === violation.violation_id}
                              onClose={() => setShowActionsMenu(null)}
                              position="right"
                              items={[
                                {
                                  label: 'View Details',
                                  icon: (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  ),
                                  onClick: () => {
                                    setSelectedViolation(violation);
                                    setShowViolationDetailsModal(true);
                                  },
                                  variant: 'primary'
                                },
                                {
                                  label: 'Go to Profile',
                                  icon: (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  ),
                                  onClick: () => {
                                    const type = violation.user_id ? 'users' : 'service-providers';
                                    window.location.href = `/dashboard/${type}`;
                                  },
                                  variant: 'default'
                                },
                                {
                                  label: 'Dismiss Violation',
                                  icon: (
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  ),
                                  onClick: () => {
                                    setSelectedViolation(violation);
                                    setShowDismissModal(true);
                                  },
                                  variant: 'success',
                                  hidden: violation.status !== 'active'
                                }
                              ]}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredViolations.length === 0 && violations.length > 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p>No violations match your search</p>
                    <button
                      onClick={() => setViolationSearchTerm('')}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Clear search
                    </button>
                  </div>
                )}
                {violations.length === 0 && (
                  <div className="text-center py-12 text-gray-500">No violations found</div>
                )}
              </div>
            </div>
          )}

          {/* Appeals Tab */}
          {activeTab === 'appeals' && (
            <div className="space-y-6">
              {appeals.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <div className="flex flex-col items-center">
                    <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 text-lg">No pending appeals</p>
                    <p className="text-gray-400 text-sm mt-2">Appeals from users will appear here for review</p>
                  </div>
                </div>
              ) : (
                appeals.map((appeal) => (
                  <div key={appeal.violation_id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                    {/* Header with status badge */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-yellow-100">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-lg shadow-sm">
                            <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              Violation #{appeal.violation_id}
                            </h3>
                            <p className="text-sm text-gray-600">{appeal.violation_name}</p>
                          </div>
                        </div>
                        <span className="px-4 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold shadow-sm">
                          🔔 Pending Review
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5">
                      {/* Account Info & Points */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Account Info */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center mb-2">
                            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account</span>
                          </div>
                          {appeal.user && (
                            <div>
                              <div className="font-semibold text-gray-900 text-lg">{appeal.user.first_name} {appeal.user.last_name}</div>
                              <div className="text-sm text-gray-600 mt-1">{appeal.user.email}</div>
                              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                User ID: {appeal.user.user_id}
                              </div>
                            </div>
                          )}
                          {appeal.provider && (
                            <div>
                              <div className="font-semibold text-gray-900 text-lg">
                                {appeal.provider.provider_first_name} {appeal.provider.provider_last_name}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">{appeal.provider.provider_email}</div>
                              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                Provider ID: {appeal.provider.provider_id}
                              </div>
                            </div>
                          )}
                          {!appeal.user && !appeal.provider && (
                            <div className="text-gray-500 text-sm">Account information unavailable</div>
                          )}
                        </div>

                        {/* Points Deducted */}
                        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                          <div className="flex items-center mb-2">
                            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                            <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Penalty Points</span>
                          </div>
                          <div className="text-4xl font-bold text-red-600">
                            -{appeal.penalty_points_deducted || appeal.points_deducted || appeal.violation_type?.penalty_points || 0}
                          </div>
                          <div className="text-xs text-red-600 mt-1">points deducted</div>
                        </div>
                      </div>

                      {/* Appeal Reason */}
                      <div className="bg-blue-50 rounded-lg p-5 border-l-4 border-blue-400 mb-6">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-blue-900 block mb-2">Appeal Reason:</span>
                            <p className="text-gray-800 leading-relaxed">
                              {appeal.appeal_reason || 'No reason provided'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Evidence/Attachments */}
                      {(() => {
                        const evidenceUrls = appeal.evidence_urls || appeal.appeal_evidence || appeal.evidence;
                        const evidenceArray = evidenceUrls 
                          ? (Array.isArray(evidenceUrls) ? evidenceUrls : [evidenceUrls])
                          : [];
                        
                        // Debug log
                        console.log('Appeal evidence data:', {
                          violation_id: appeal.violation_id,
                          evidence_urls: appeal.evidence_urls,
                          appeal_evidence: appeal.appeal_evidence,
                          evidence: appeal.evidence,
                          evidenceArray
                        });
                        
                        if (evidenceArray.length > 0) {
                          return (
                            <div className="bg-green-50 rounded-lg p-5 border-l-4 border-green-400 mb-6">
                              <div className="flex items-start mb-3">
                                <div className="flex-shrink-0 mr-3">
                                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <span className="text-sm font-semibold text-green-900 block mb-2">
                                    Evidence Submitted ({evidenceArray.length} {evidenceArray.length === 1 ? 'file' : 'files'}):
                                  </span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                                {evidenceArray.map((url: string, index: number) => (
                                  <a
                                    key={index}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-green-200"
                                  >
                                    <div className="aspect-square relative">
                                      <Image
                                        src={url}
                                        alt={`Evidence ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"%3E%3Cpath stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /%3E%3C/svg%3E';
                                        }}
                                      />
                                      {/* Overlay on hover */}
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                      </div>
                                    </div>
                                    <div className="px-2 py-1.5 bg-gray-50 border-t border-gray-200">
                                      <p className="text-xs text-gray-600 truncate">Evidence {index + 1}</p>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-300 mb-6">
                              <div className="flex items-center">
                                <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm text-gray-600">No evidence files submitted with this appeal</span>
                              </div>
                            </div>
                          );
                        }
                      })()}

                      {/* Action Button */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            console.log('Selected appeal data:', appeal);
                            console.log('Violation name:', appeal.violation_name);
                            console.log('Violation type:', appeal.violation_type);
                            console.log('Violation code:', appeal.violation_code);
                            setSelectedAppeal(appeal);
                            setShowAppealModal(true);
                          }}
                          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          Review Appeal
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Restricted Accounts Tab */}
          {/* Adjustment Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              {/* Filter Section */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">Filters & Search</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search Bar */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={logsSearchTerm}
                        onChange={(e) => setLogsSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Search by Account, Admin, or Reason..."
                      />
                      {logsSearchTerm && (
                        <button
                          onClick={() => setLogsSearchTerm('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Adjustment Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Type</label>
                    <select
                      value={logsTypeFilter}
                      onChange={(e) => setLogsTypeFilter(e.target.value)}
                      className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="all">All Types</option>
                      <option value="penalty">Penalty</option>
                      <option value="reward">Restore/Reward</option>
                      <option value="suspension">Suspension</option>
                      <option value="restore">Restore</option>
                      <option value="bonus">Bonus</option>
                    </select>
                  </div>

                  {/* Admin Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin</label>
                    <select
                      value={logsAdminFilter}
                      onChange={(e) => setLogsAdminFilter(e.target.value)}
                      className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="all">All Admins</option>
                      {uniqueAdmins.map((admin) => (
                        <option key={admin} value={admin}>{admin}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                    <select
                      value={logsDateFilter}
                      onChange={(e) => setLogsDateFilter(e.target.value)}
                      className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="all">All Time</option>
                      <option value="7days">Last 7 Days</option>
                      <option value="30days">Last 30 Days</option>
                      <option value="90days">Last 90 Days</option>
                    </select>
                  </div>

                  {/* Results Count */}
                  <div className="lg:col-span-3 flex items-end">
                    <div className="text-sm text-gray-600">
                      Showing <span className="font-semibold text-gray-900">{filteredLogs.length}</span> of <span className="font-semibold text-gray-900">{adjustmentLogs.length}</span> logs
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setLogsSearchTerm('');
                        setLogsTypeFilter('all');
                        setLogsAdminFilter('all');
                        setLogsDateFilter('all');
                      }}
                      className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Logs Table */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Account</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Points Change</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Reason</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Admin</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500">
                              <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-lg font-medium">No adjustment logs found</p>
                              <p className="text-sm mt-1">Try adjusting your filters or search criteria</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log) => {
                          const accountType = log.user_id ? 'User' : 'Provider';
                          const accountId = log.user_id || log.provider_id;
                          const adminName = log.adjusted_by_admin?.name || log.adjusted_by_admin?.admin_name || 'System';
                          const reasonTruncated = log.reason && log.reason.length > 60 ? log.reason.substring(0, 60) + '...' : log.reason;
                          
                          return (
                            <tr key={log.adjustment_id} className="hover:bg-blue-50 transition-colors group">
                              <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900">
                                    {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${accountType === 'User' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-gray-900">{accountType} #{accountId}</span>
                                    <span className="text-xs text-gray-500">{accountType === 'User' ? 'Customer' : 'Service Provider'}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm whitespace-nowrap">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                                  log.adjustment_type === 'reward' || log.adjustment_type === 'restore' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                  log.adjustment_type === 'penalty' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                                  log.adjustment_type === 'suspension' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                  'bg-gray-100 text-gray-700 border border-gray-200'
                                }`}>
                                  {log.adjustment_type.charAt(0).toUpperCase() + log.adjustment_type.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className={`font-bold text-base ${log.points_adjusted > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {log.points_adjusted > 0 ? '+' : ''}{log.points_adjusted}
                                  </span>
                                  <span className="text-xs text-gray-500 font-medium">
                                    ({log.previous_points} → {log.new_points})
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700 max-w-md">
                                <div className="group relative">
                                  <p className="truncate">{reasonTruncated}</p>
                                  {log.reason && log.reason.length > 60 && (
                                    <div className="invisible group-hover:visible absolute z-50 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl -top-2 left-0 transform -translate-y-full">
                                      <div className="font-medium mb-1">Full Reason:</div>
                                      {log.reason}
                                      <div className="absolute bottom-0 left-8 transform translate-y-full">
                                        <div className="border-8 border-transparent border-t-gray-900"></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                                    {adminName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                  </div>
                                  <span className="font-medium text-gray-900">{adminName}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Info */}
                {filteredLogs.length > 0 && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Displaying all <span className="font-semibold text-gray-900">{filteredLogs.length}</span> results
                      </div>
                      <div className="text-xs text-gray-500">
                        Last updated: {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Adjust Points Modal */}
      <AdjustPointsModal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        onSubmit={handleAdjustPoints}
      />

      {/* Suspension Modal */}
      {showSuspensionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Manage Suspension</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input
                  type="number"
                  value={suspensionForm.userId}
                  onChange={(e) => setSuspensionForm({ ...suspensionForm, userId: e.target.value, providerId: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider ID</label>
                <input
                  type="number"
                  value={suspensionForm.providerId}
                  onChange={(e) => setSuspensionForm({ ...suspensionForm, providerId: e.target.value, userId: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select
                  value={suspensionForm.action}
                  onChange={(e) => setSuspensionForm({ ...suspensionForm, action: e.target.value as 'suspend' | 'lift' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="suspend">Suspend Account</option>
                  <option value="lift">Lift Suspension</option>
                </select>
              </div>

              {suspensionForm.action === 'suspend' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Suspension Days (empty = indefinite)
                  </label>
                  <input
                    type="number"
                    value={suspensionForm.suspensionDays}
                    onChange={(e) => setSuspensionForm({ ...suspensionForm, suspensionDays: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Leave empty for indefinite"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (min 10 characters)</label>
                <textarea
                  value={suspensionForm.reason}
                  onChange={(e) => setSuspensionForm({ ...suspensionForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleManageSuspension}
                disabled={!suspensionForm.reason || suspensionForm.reason.length < 10 || (!suspensionForm.userId && !suspensionForm.providerId)}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {suspensionForm.action === 'suspend' ? 'Suspend' : 'Lift Suspension'}
              </button>
              <button
                onClick={() => {
                  setShowSuspensionModal(false);
                  setSuspensionForm({ userId: '', providerId: '', action: 'suspend', reason: '', suspensionDays: '' });
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Points Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Reset Points</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <input
                  type="number"
                  value={resetForm.userId}
                  onChange={(e) => setResetForm({ ...resetForm, userId: e.target.value, providerId: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider ID</label>
                <input
                  type="number"
                  value={resetForm.providerId}
                  onChange={(e) => setResetForm({ ...resetForm, providerId: e.target.value, userId: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reset Value (default: 100)</label>
                <input
                  type="number"
                  value={resetForm.resetValue}
                  onChange={(e) => setResetForm({ ...resetForm, resetValue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (min 10 characters)</label>
                <textarea
                  value={resetForm.reason}
                  onChange={(e) => setResetForm({ ...resetForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Explain why points are being reset (e.g., rehabilitation)"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleResetPoints}
                disabled={!resetForm.reason || resetForm.reason.length < 10 || (!resetForm.userId && !resetForm.providerId)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Reset Points
              </button>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetForm({ userId: '', providerId: '', reason: '', resetValue: '100' });
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appeal Review Modal */}
      <ReviewAppealModal
        isOpen={showAppealModal}
        onClose={() => {
          setShowAppealModal(false);
          setSelectedAppeal(null);
        }}
        onSubmit={handleReviewAppeal}
        appeal={selectedAppeal ? {
          violation_id: selectedAppeal.violation_id,
          violation_type: selectedAppeal.violation_type?.violation_name || selectedAppeal.violation_name || selectedAppeal.violation_code || 'Violation',
          points_deducted: selectedAppeal.penalty_points_deducted || selectedAppeal.points_deducted || selectedAppeal.violation_type?.penalty_points || 0,
          appeal_reason: selectedAppeal.appeal_reason || '',
          user_name: selectedAppeal.user ? `${selectedAppeal.user.first_name} ${selectedAppeal.user.last_name}` : undefined,
          provider_name: selectedAppeal.provider ? `${selectedAppeal.provider.provider_first_name} ${selectedAppeal.provider.provider_last_name}` : undefined
        } : null}
      />

      {/* View Violation Details Modal */}
      {showViolationDetailsModal && selectedViolation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Violation Details</h3>
              <button
                onClick={() => setShowViolationDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Violation ID:</span>
                    <p className="text-gray-900 font-semibold">#{selectedViolation.violation_id}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Status:</span>
                    <p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedViolation.status)}`}>
                        {selectedViolation.status.toUpperCase()}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Violation Type:</span>
                <p className="text-gray-900 font-semibold mt-1">
                  {selectedViolation.violation_name || selectedViolation.violation_type?.violation_name || 'Unknown'}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Code: {selectedViolation.violation_code || selectedViolation.violation_type?.violation_code || 'N/A'}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Points Deducted:</span>
                <p className="text-red-600 font-bold text-2xl mt-1">
                  -{selectedViolation.penalty_points_deducted || selectedViolation.points_deducted || selectedViolation.violation_type?.penalty_points || 0}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Account:</span>
                {selectedViolation.user && (
                  <div className="mt-2">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                        USER
                      </span>
                      <span className="font-medium text-gray-900">
                        {selectedViolation.user.first_name} {selectedViolation.user.last_name}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">Email: {selectedViolation.user.email}</p>
                    <p className="text-gray-500 text-sm">ID: {selectedViolation.user.user_id}</p>
                  </div>
                )}
                {selectedViolation.provider && (
                  <div className="mt-2">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                        PROVIDER
                      </span>
                      <span className="font-medium text-gray-900">
                        {selectedViolation.provider.provider_first_name} {selectedViolation.provider.provider_last_name}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">Email: {selectedViolation.provider.provider_email}</p>
                    <p className="text-gray-500 text-sm">ID: {selectedViolation.provider.provider_id}</p>
                  </div>
                )}
                {!selectedViolation.user && selectedViolation.user_id && (
                  <p className="text-gray-500 mt-1">User ID: {selectedViolation.user_id}</p>
                )}
                {!selectedViolation.provider && selectedViolation.provider_id && (
                  <p className="text-gray-500 mt-1">Provider ID: {selectedViolation.provider_id}</p>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Date Created:</span>
                <p className="text-gray-900 mt-1">
                  {new Date(selectedViolation.created_at).toLocaleString()}
                </p>
              </div>

              {selectedViolation.appeal_reason && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <span className="text-sm font-medium text-yellow-800">Appeal Reason:</span>
                  <p className="text-gray-900 mt-1">{selectedViolation.appeal_reason}</p>
                  {selectedViolation.appeal_status && (
                    <p className="text-sm text-gray-600 mt-2">
                      Status: <span className="font-medium">{selectedViolation.appeal_status}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowViolationDetailsModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dismiss Violation Modal */}
      {showDismissModal && selectedViolation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Dismiss Violation</h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <div className="text-sm font-medium text-gray-600 mb-2">Violation:</div>
              <div className="text-gray-900 font-semibold">
                {selectedViolation.violation_name || selectedViolation.violation_type?.violation_name}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Violation ID: #{selectedViolation.violation_id}
              </div>
              <div className="text-sm text-red-600 mt-1 font-medium">
                Points to restore: +{selectedViolation.penalty_points_deducted || selectedViolation.points_deducted || selectedViolation.violation_type?.penalty_points || 0}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Dismissal
                </label>
                <select
                  value={dismissReason}
                  onChange={(e) => {
                    setDismissReason(e.target.value);
                    if (e.target.value !== 'Other') {
                      setCustomDismissReason('');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a reason...</option>
                  {reasonsData.violationDismissal.map((reason, index) => (
                    <option key={index} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              {dismissReason === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Reason (min 10 characters)
                  </label>
                  <textarea
                    value={customDismissReason}
                    onChange={(e) => setCustomDismissReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Explain why this violation is being dismissed..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {customDismissReason.length}/10 characters minimum
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleDismissViolation}
                disabled={
                  !dismissReason || 
                  (dismissReason === 'Other' && (!customDismissReason || customDismissReason.length < 10))
                }
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Dismiss & Restore Points
              </button>
              <button
                onClick={() => {
                  setShowDismissModal(false);
                  setSelectedViolation(null);
                  setDismissReason('');
                  setCustomDismissReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
