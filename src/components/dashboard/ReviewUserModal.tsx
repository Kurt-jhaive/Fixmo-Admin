'use client';

import { useState } from 'react';
import Image from 'next/image';
import SmartImage from '@/components/SmartImage';
import type { User } from '@/lib/api';

interface ReviewUserModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (userId: number) => void;
  onReject: (userId: number) => void;
}

export default function ReviewUserModal({
  user,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: ReviewUserModalProps) {
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="relative mx-auto w-full max-w-5xl bg-white rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden my-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 flex-shrink-0">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Review User Verification</h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="p-8 overflow-y-auto max-h-[calc(95vh-12rem)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Profile Details */}
              <div className="space-y-6">
                {/* User Profile Header */}
                <div className="flex flex-col items-center text-center pb-6 border-b border-gray-200">
                  <div className="mb-4">
                    <SmartImage
                      src={user.profile_photo}
                      alt={`${user.first_name} ${user.last_name}`}
                      width={120}
                      height={120}
                      className="h-28 w-28 rounded-full object-cover ring-4 ring-blue-100 shadow-lg"
                      fallbackType="profile"
                      fallbackContent={
                        <div className="h-28 w-28 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center ring-4 ring-blue-100 shadow-lg">
                          <span className="text-4xl font-bold text-white">
                            {user.first_name[0]}{user.last_name[0]}
                          </span>
                        </div>
                      }
                    />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 uppercase tracking-wide mb-2">
                    {user.first_name} {user.last_name}
                  </h3>
                  
                  <p className="text-lg text-gray-600 mb-3">@{user.userName}</p>
                  
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Pending Verification
                  </span>
                </div>

                {/* Profile Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile Information
                  </h4>

                  <div className="space-y-3">
                    {/* Email Address */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Email Address
                      </label>
                      <p className="text-base font-medium text-gray-900 break-all">
                        {user.email}
                      </p>
                    </div>

                    {/* Phone Number */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Phone Number
                      </label>
                      <p className="text-base font-medium text-gray-900">
                        {user.phone_number}
                      </p>
                    </div>

                    {/* Location */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Location
                      </label>
                      <p className="text-base font-medium text-gray-900 uppercase">
                        {user.exact_location || user.user_location || 'Not specified'}
                      </p>
                    </div>

                    {/* Birthday */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Birthday
                      </label>
                      <p className="text-base font-medium text-gray-900">
                        {user.birthday 
                          ? new Date(user.birthday).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'Not specified'
                        }
                      </p>
                    </div>

                    {/* Account Created */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Account Created
                      </label>
                      <p className="text-base font-medium text-gray-900">
                        {new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Verification Document */}
              <div className="space-y-6">
                <div className="sticky top-0">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Valid ID Document
                  </h4>

                  {user.valid_id ? (
                    <div className="relative group">
                      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100 shadow-lg hover:shadow-xl transition-shadow">
                        <SmartImage
                          src={user.valid_id}
                          alt="Valid ID"
                          width={600}
                          height={400}
                          className="w-full h-auto cursor-zoom-in"
                          fallbackType="document"
                          onClick={() => setIsImageZoomed(true)}
                        />
                      </div>
                      
                      {/* Zoom Hint */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-zoom-in pointer-events-none">
                        <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
                          <p className="text-sm font-medium text-gray-900 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                            Click to zoom
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 font-medium">No ID document uploaded</p>
                    </div>
                  )}

                  {/* Document Info */}
                  {user.valid_id && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900">Review Guidelines</p>
                          <p className="text-sm text-blue-700 mt-1">
                            Verify that the ID is clear, valid, and matches the user&apos;s profile information.
                            Check for expiration dates and ensure all details are legible.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Action Bar */}
          <div className="border-t border-gray-200 bg-gray-50 px-8 py-6 flex items-center justify-between flex-shrink-0">
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancel
            </button>

            <div className="flex gap-4">
              {/* Reject Button */}
              <button
                onClick={() => onReject(user.user_id)}
                className="px-6 py-3 bg-white border-2 border-red-500 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Reject
              </button>

              {/* Approve Button */}
              <button
                onClick={() => onApprove(user.user_id)}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Image Zoom Modal */}
      {isImageZoomed && user.valid_id && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-[60] flex items-center justify-center p-4"
          onClick={() => setIsImageZoomed(false)}
        >
          <div className="relative max-w-7xl max-h-screen">
            {/* Close Button */}
            <button
              onClick={() => setIsImageZoomed(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              aria-label="Close zoomed view"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Zoomed Image */}
            <div className="relative max-w-full max-h-[90vh]">
              <Image
                src={user.valid_id}
                alt="Valid ID - Zoomed"
                width={1200}
                height={800}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                onError={() => {}}
              />
            </div>

            {/* Instructions */}
            <div className="absolute -bottom-12 left-0 right-0 text-center">
              <p className="text-white text-sm">Click anywhere to close</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
