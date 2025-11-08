'use client';

import { useState, useEffect, useRef } from 'react';
import { adminApi } from '@/lib/api';

interface Account {
  id: number;
  name: string;
  type: 'user' | 'provider';
  points?: number;
  email?: string;
}

interface UserResponse {
  user_id: number;
  user_name?: string;
  first_name?: string;
  last_name?: string;
  points?: number;
  user_email?: string;
  email?: string;
}

interface ProviderResponse {
  provider_id: number;
  provider_name?: string;
  provider_first_name?: string;
  provider_last_name?: string;
  points?: number;
  provider_email?: string;
}

interface AdjustPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AdjustmentData) => Promise<void>;
}

export interface AdjustmentData {
  accountId: number;
  accountType: 'user' | 'provider';
  points: number;
  actionType: 'add' | 'deduct';
  reason: string;
  customReason?: string;
}

const PREDEFINED_REASONS = {
  add: [
    'Excellent Service',
    'Appeal Approved',
    'System Adjustment',
    'Compensation for Inconvenience',
    'Loyalty Reward',
    'Promotional Bonus',
    'Error Correction',
    '[Other - Explain Below]'
  ],
  deduct: [
    'Minor Violation',
    'Late Cancellation',
    'No Show',
    'Poor Service Quality',
    'Inappropriate Behavior',
    'Policy Violation',
    'Customer Complaint',
    '[Other - Explain Below]'
  ]
};

export default function AdjustPointsModal({ isOpen, onClose, onSubmit }: AdjustPointsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const [actionType, setActionType] = useState<'add' | 'deduct'>('add');
  const [points, setPoints] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search for accounts
  useEffect(() => {
    const searchAccounts = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      setShowDropdown(true);

      try {
        console.log('Searching for:', searchTerm);
        
        // Search both users and providers
        const [usersResponse, providersResponse] = await Promise.all([
          adminApi.getUsers({ search: searchTerm, limit: 5 }),
          adminApi.getProviders({ search: searchTerm, limit: 5 })
        ]);

        console.log('Users response:', usersResponse);
        console.log('Providers response:', providersResponse);

        // Handle different response formats - API might return array directly or wrapped in object
        const usersArray = Array.isArray(usersResponse) ? usersResponse : (usersResponse.users || usersResponse.data || []);
        const providersArray = Array.isArray(providersResponse) ? providersResponse : (providersResponse.providers || providersResponse.data || []);

        console.log('Users array:', usersArray);
        console.log('Providers array:', providersArray);

        const users: Account[] = (usersArray || [])
          .filter((user: UserResponse) => user.user_id && (user.user_name || user.first_name))
          .map((user: UserResponse) => ({
            id: user.user_id,
            name: user.user_name || `${user.first_name} ${user.last_name}`.trim(),
            type: 'user' as const,
            points: user.points,
            email: user.user_email || user.email
          }));

        const providers: Account[] = (providersArray || [])
          .filter((provider: ProviderResponse) => provider.provider_id && (provider.provider_name || provider.provider_first_name))
          .map((provider: ProviderResponse) => ({
            id: provider.provider_id,
            name: provider.provider_name || `${provider.provider_first_name} ${provider.provider_last_name}`.trim(),
            type: 'provider' as const,
            points: provider.points,
            email: provider.provider_email
          }));

        // Client-side filtering based on search term
        const allResults = [...users, ...providers];
        const searchLower = searchTerm.toLowerCase().trim();
        const filteredResults = allResults.filter(account => {
          const nameLower = (account.name || '').toLowerCase();
          const emailLower = (account.email || '').toLowerCase();
          const idStr = account.id.toString();
          
          return nameLower.includes(searchLower) || 
                 emailLower.includes(searchLower) || 
                 idStr.includes(searchLower);
        });

        console.log('Mapped users:', users);
        console.log('Mapped providers:', providers);
        console.log('Total results before filter:', allResults.length);
        console.log('Filtered results:', filteredResults.length);

        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Error searching accounts:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchAccounts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectAccount = (account: Account) => {
    setSelectedAccount(account);
    setSearchTerm(`${account.type === 'user' ? 'User' : 'Provider'}: ${account.name || 'Unnamed'} (ID: ${account.id})`);
    setShowDropdown(false);
  };

  const handleClearAccount = () => {
    setSelectedAccount(null);
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!selectedAccount || !points || !selectedReason) return;

    const isOtherReason = selectedReason === '[Other - Explain Below]';
    if (isOtherReason && customReason.trim().length < 10) return;

    setIsSubmitting(true);

    try {
      await onSubmit({
        accountId: selectedAccount.id,
        accountType: selectedAccount.type,
        points: Number(points),
        actionType,
        reason: isOtherReason ? customReason : selectedReason,
        customReason: isOtherReason ? customReason : undefined
      });

      // Reset form
      handleClose();
    } catch (error) {
      console.error('Error adjusting points:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedAccount(null);
    setSearchTerm('');
    setActionType('add');
    setPoints('');
    setSelectedReason('');
    setCustomReason('');
    setSearchResults([]);
    setShowDropdown(false);
    onClose();
  };

  const isFormValid = () => {
    if (!selectedAccount || !points || Number(points) <= 0 || !selectedReason) {
      return false;
    }
    
    if (selectedReason === '[Other - Explain Below]' && customReason.trim().length < 10) {
      return false;
    }

    return true;
  };

  if (!isOpen) return null;

  const currentReasons = PREDEFINED_REASONS[actionType];
  const showCustomReasonField = selectedReason === '[Other - Explain Below]';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-white">Adjust Points</h3>
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
          {/* Account Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Account to Adjust <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (!selectedAccount) setShowDropdown(true);
                  }}
                  onFocus={() => {
                    if (searchTerm.length >= 2 && !selectedAccount) setShowDropdown(true);
                  }}
                  placeholder="Search by name or ID..."
                  className="w-full pl-11 pr-10 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {selectedAccount && (
                  <button
                    onClick={handleClearAccount}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Dropdown */}
              {showDropdown && !selectedAccount && (
                <div
                  ref={dropdownRef}
                  className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 max-h-80 overflow-y-auto"
                  style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                >
                  {isSearching ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <p className="text-sm">Searching...</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium">No accounts found</p>
                      <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                    </div>
                  ) : (
                    <div className="py-2">
                      {searchResults.map((account) => {
                        // Get initials from name
                        const getInitials = (name: string | undefined) => {
                          if (!name) return '??';
                          return name
                            .split(' ')
                            .map(word => word[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2) || '??';
                        };

                        const initials = getInitials(account.name);
                        const isUser = account.type === 'user';

                        return (
                          <button
                            key={`${account.type}-${account.id}`}
                            onClick={() => handleSelectAccount(account)}
                            className="w-full px-4 py-3 hover:bg-gray-50 transition-all duration-150 text-left flex items-center gap-3 group border-b border-gray-100 last:border-b-0"
                          >
                            {/* Avatar/Icon */}
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                              isUser 
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
                                : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
                            }`}>
                              {isUser ? (
                                <span>{initials}</span>
                              ) : (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>

                            {/* Account Info */}
                            <div className="flex-1 min-w-0">
                              {/* Line 1: Name */}
                              <p className="font-bold text-gray-900 text-sm truncate">
                                {account.name || 'Unnamed Account'}
                              </p>
                              
                              {/* Line 2: Type, ID, and additional info */}
                              <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-0.5">
                                <span className={`font-medium ${isUser ? 'text-blue-600' : 'text-purple-600'}`}>
                                  {isUser ? 'User' : 'Provider'}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span>ID: {account.id}</span>
                                {account.email && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <span className="truncate max-w-[200px]">{account.email}</span>
                                  </>
                                )}
                                {account.points !== undefined && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <span className="font-semibold text-gray-700">{account.points} pts</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Right arrow indicator on hover */}
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Account Info */}
            {selectedAccount && (
              <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Selected Account</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">{selectedAccount.name || 'Unnamed Account'}</p>
                    <p className="text-xs text-gray-600">
                      {selectedAccount.type === 'user' ? 'User' : 'Provider'} ID: {selectedAccount.id}
                    </p>
                  </div>
                  {selectedAccount.points !== undefined && (
                    <div className="text-right">
                      <p className="text-xs text-blue-600 font-semibold">Current Points</p>
                      <p className="text-2xl font-bold text-gray-900">{selectedAccount.points}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Type */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Action Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setActionType('add');
                  setSelectedReason('');
                  setCustomReason('');
                }}
                className={`relative py-4 px-4 rounded-xl border-2 transition-all ${
                  actionType === 'add'
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-600 text-white shadow-lg scale-105'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-emerald-400 hover:bg-emerald-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    actionType === 'add' ? 'border-white' : 'border-gray-400'
                  }`}>
                    {actionType === 'add' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="font-semibold">Add Points</span>
                </div>
                <p className={`text-xs mt-1 ${actionType === 'add' ? 'text-emerald-100' : 'text-gray-500'}`}>
                  (Reward)
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActionType('deduct');
                  setSelectedReason('');
                  setCustomReason('');
                }}
                className={`relative py-4 px-4 rounded-xl border-2 transition-all ${
                  actionType === 'deduct'
                    ? 'bg-gradient-to-br from-rose-500 to-red-600 border-rose-600 text-white shadow-lg scale-105'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-rose-400 hover:bg-rose-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    actionType === 'deduct' ? 'border-white' : 'border-gray-400'
                  }`}>
                    {actionType === 'deduct' && (
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="font-semibold">Deduct Points</span>
                </div>
                <p className={`text-xs mt-1 ${actionType === 'deduct' ? 'text-rose-100' : 'text-gray-500'}`}>
                  (Penalty)
                </p>
              </button>
            </div>
          </div>

          {/* Points Amount */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Points Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                placeholder="Enter points amount"
                className="w-full pl-4 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
              />
            </div>
            {points && Number(points) > 0 && (
              <p className={`text-sm font-medium ${actionType === 'add' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {actionType === 'add' ? '+' : '-'}{points} points will be {actionType === 'add' ? 'added to' : 'deducted from'} this account
              </p>
            )}
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => {
                setSelectedReason(e.target.value);
                if (e.target.value !== '[Other - Explain Below]') {
                  setCustomReason('');
                }
              }}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 bg-white"
            >
              <option value="">Select a reason...</option>
              {currentReasons.map((reason, index) => (
                <option key={index} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Reason Field */}
          {showCustomReasonField && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-semibold text-gray-900">
                Detailed Explanation <span className="text-red-500">*</span>
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please provide a detailed explanation (minimum 10 characters)..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400 resize-none"
              />
              <div className="flex items-center justify-between">
                <p className={`text-xs ${customReason.length >= 10 ? 'text-emerald-600' : 'text-gray-500'}`}>
                  {customReason.length >= 10 ? '✓ ' : ''}Minimum 10 characters required
                </p>
                <p className="text-xs text-gray-500">{customReason.length} characters</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || isSubmitting}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
              isFormValid() && !isSubmitting
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
              'Adjust Points'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
