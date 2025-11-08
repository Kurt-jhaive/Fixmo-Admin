'use client';

import { useState, useEffect } from 'react';

interface ReviewAppealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AppealReviewData) => Promise<void>;
  appeal: AppealData | null;
}

export interface AppealData {
  violation_id: number;
  violation_type: string;
  points_deducted: number;
  appeal_reason: string;
  user_name?: string;
  provider_name?: string;
}

export interface AppealReviewData {
  decision: 'approve' | 'reject';
  reason: string;
  reviewNotes?: string;
}

const APPEAL_REASONS = {
  approve: [
    'Evidence provided was sufficient',
    'System error confirmed',
    'First-time offense / Warning issued',
    'Goodwill gesture',
    'Violation occurred beyond user/provider control',
    'Policy clarification supports appeal',
    '[Other - Add Custom Note]'
  ],
  reject: [
    'Violation confirmed by evidence',
    'Insufficient evidence provided',
    'Appeal outside of allowed time',
    'Repeated violation pattern',
    'No valid justification provided',
    'Evidence contradicts appeal claim',
    '[Other - Add Custom Note]'
  ]
};

export default function ReviewAppealModal({ isOpen, onClose, onSubmit, appeal }: ReviewAppealModalProps) {
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve');
  const [selectedReason, setSelectedReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setDecision('approve');
      setSelectedReason('');
      setReviewNotes('');
    }
  }, [isOpen]);

  // Clear custom notes when changing reason
  useEffect(() => {
    if (selectedReason !== '[Other - Add Custom Note]') {
      setReviewNotes('');
    }
  }, [selectedReason]);

  // Clear reason when decision changes
  useEffect(() => {
    setSelectedReason('');
    setReviewNotes('');
  }, [decision]);

  const handleSubmit = async () => {
    if (!selectedReason) return;

    const isOtherReason = selectedReason === '[Other - Add Custom Note]';
    if (isOtherReason && reviewNotes.trim().length < 10) return;

    setIsSubmitting(true);

    try {
      await onSubmit({
        decision,
        reason: isOtherReason ? reviewNotes : selectedReason,
        reviewNotes: isOtherReason ? reviewNotes : undefined
      });

      handleClose();
    } catch (error) {
      console.error('Error reviewing appeal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDecision('approve');
    setSelectedReason('');
    setReviewNotes('');
    onClose();
  };

  const isFormValid = () => {
    if (!selectedReason) return false;
    
    if (selectedReason === '[Other - Add Custom Note]' && reviewNotes.trim().length < 10) {
      return false;
    }

    return true;
  };

  if (!isOpen || !appeal) return null;

  const currentReasons = APPEAL_REASONS[decision];
  const showCustomNoteField = selectedReason === '[Other - Add Custom Note]';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white">Review Appeal</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">
          {/* Context Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Violation Info */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 bg-red-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Original Violation</p>
                  <p className="font-bold text-gray-900 text-sm truncate">{appeal.violation_type}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-red-600 font-semibold">Points:</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                      {appeal.points_deducted}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 bg-blue-100 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Account</p>
                  <p className="font-bold text-gray-900 text-sm truncate">
                    {appeal.user_name || appeal.provider_name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {appeal.user_name ? 'User' : 'Provider'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* User's Appeal Reason */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 bg-amber-100 p-2 rounded-lg">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">User&apos;s Appeal Reason</p>
                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {appeal.appeal_reason || 'No reason provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Decision Section */}
          <div className="border-t-2 border-gray-200 pt-6 space-y-5">
            <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Admin Decision
            </h4>

            {/* Decision Dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Decision <span className="text-red-500">*</span>
              </label>
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value as 'approve' | 'reject')}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 bg-white font-medium"
              >
                <option value="approve">✓ Approve Appeal</option>
                <option value="reject">✗ Reject Appeal</option>
              </select>
            </div>

            {/* Reason Combo Box */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 bg-white"
              >
                <option value="">Select a reason...</option>
                {currentReasons.map((reason, index) => (
                  <option key={index} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {decision === 'approve' ? 'Select why this appeal should be approved' : 'Select why this appeal should be rejected'}
              </p>
            </div>

            {/* Custom Note Field (Conditional) */}
            {showCustomNoteField && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-semibold text-gray-900">
                  Review Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Please provide detailed notes explaining your decision (minimum 10 characters)..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400 resize-none"
                />
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${reviewNotes.length >= 10 ? 'text-emerald-600 font-semibold' : 'text-gray-500'}`}>
                    {reviewNotes.length >= 10 ? '✓ ' : ''}Minimum 10 characters required
                  </p>
                  <p className="text-xs text-gray-500">{reviewNotes.length} characters</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200 flex gap-3">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || isSubmitting}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              decision === 'approve'
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 hover:shadow-xl'
                : 'bg-gradient-to-r from-rose-500 to-red-600 text-white hover:from-rose-600 hover:to-red-700 hover:shadow-xl'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing...</span>
              </div>
            ) : (
              <>
                {decision === 'approve' ? (
                  <>
                    <svg className="w-5 h-5 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve Appeal
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject Appeal
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
