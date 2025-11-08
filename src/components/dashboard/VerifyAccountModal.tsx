"use client";

import { useState, useEffect } from "react";

type Decision = 'approve' | 'reject';

interface VerifyAccountModalProps {
  isOpen: boolean;
  accountType: 'user' | 'provider';
  accountName: string;
  onConfirm: (decision: Decision, reason: string, customNote?: string) => void;
  onClose: () => void;
}

// Approval reasons
const approvalReasons = [
  "ID matched profile details",
  "Documents validated successfully",
  "Verification complete",
  "Goodwill Approval",
  "[Other - Add Custom Note]"
];

// Rejection reasons
const rejectionReasons = [
  "Uploaded ID is blurry or unreadable",
  "Name on ID does not match account name",
  "Expired or invalid government ID",
  "Incomplete or inconsistent profile details",
  "Location/address cannot be verified",
  "Suspected fake or tampered ID",
  "Duplicate or multiple accounts using the same ID",
  "Suspicious or fraudulent activity detected",
  "ID mismatch with profile",
  "Document illegible",
  "Invalid document type",
  "Suspicious document",
  "Profile data inconsistency",
  "[Other - Add Custom Note]"
];

export default function VerifyAccountModal({
  isOpen,
  accountType,
  accountName,
  onConfirm,
  onClose,
}: VerifyAccountModalProps) {
  const [decision, setDecision] = useState<Decision>('approve');
  const [reason, setReason] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [showCustomNote, setShowCustomNote] = useState(false);
  const [errors, setErrors] = useState<{ reason?: string; customNote?: string }>({});

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDecision('approve');
      setReason("");
      setCustomNote("");
      setShowCustomNote(false);
      setErrors({});
    }
  }, [isOpen]);

  // Handle reason selection
  const handleReasonChange = (selectedReason: string) => {
    setReason(selectedReason);
    setShowCustomNote(selectedReason === "[Other - Add Custom Note]");
    setErrors({ ...errors, reason: undefined });
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: { reason?: string; customNote?: string } = {};

    if (!reason) {
      newErrors.reason = "Please select a reason";
    }

    if (showCustomNote && customNote.trim().length < 10) {
      newErrors.customNote = "Custom note must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle confirm
  const handleConfirm = () => {
    if (!validateForm()) return;

    const finalReason = showCustomNote ? customNote.trim() : reason;
    onConfirm(decision, finalReason, showCustomNote ? customNote : undefined);
  };

  if (!isOpen) return null;

  const reasons = decision === 'approve' ? approvalReasons : rejectionReasons;
  const buttonColor = decision === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';
  const buttonText = decision === 'approve' ? 'Confirm Approval' : 'Confirm Rejection';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-4">Verify Account</h3>

        {/* Account Context */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900">
            <span className="text-blue-700">{accountType === 'user' ? 'User' : 'Provider'}:</span>{' '}
            <span className="font-semibold">{accountName}</span>
          </p>
        </div>

        {/* Decision Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Decision <span className="text-red-500">*</span>
          </label>
          <select
            value={decision}
            onChange={(e) => {
              setDecision(e.target.value as Decision);
              setReason("");
              setShowCustomNote(false);
              setCustomNote("");
              setErrors({});
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          >
            <option value="approve">Approve Verification</option>
            <option value="reject">Reject Verification</option>
          </select>
        </div>

        {/* Reason Combo Box */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => handleReasonChange(e.target.value)}
            className={`w-full px-4 py-2 border ${
              errors.reason ? 'border-red-300' : 'border-gray-300'
            } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900`}
          >
            <option value="">Select a reason...</option>
            {reasons.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {errors.reason && (
            <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
          )}
        </div>

        {/* Custom Note Field (Conditional) */}
        {showCustomNote && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={customNote}
              onChange={(e) => {
                setCustomNote(e.target.value);
                setErrors({ ...errors, customNote: undefined });
              }}
              placeholder="Explain custom reason (minimum 10 characters)"
              rows={4}
              className={`w-full px-4 py-2 border ${
                errors.customNote ? 'border-red-300' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 resize-none`}
            />
            <p className="mt-1 text-xs text-gray-500">
              {customNote.length}/10 characters minimum
            </p>
            {errors.customNote && (
              <p className="mt-1 text-sm text-red-600">{errors.customNote}</p>
            )}
          </div>
        )}

        {/* Decision Preview */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Action Preview:</span> You are about to{' '}
            <span className={decision === 'approve' ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
              {decision === 'approve' ? 'APPROVE' : 'REJECT'}
            </span>{' '}
            the verification for <span className="font-semibold">{accountName}</span>
            {reason && reason !== "[Other - Add Custom Note]" && (
              <span>
                {' '}with reason: <span className="italic">&quot;{reason}&quot;</span>
              </span>
            )}
            {showCustomNote && customNote.trim() && (
              <span>
                {' '}with custom note: <span className="italic">&quot;{customNote.trim()}&quot;</span>
              </span>
            )}
            .
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`px-6 py-2 ${buttonColor} text-white rounded-lg transition-colors font-medium flex items-center gap-2`}
          >
            {decision === 'approve' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
