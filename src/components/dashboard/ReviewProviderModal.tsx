"use client";

import { useState } from "react";
import SmartImage from "@/components/SmartImage";
import type { ServiceProvider } from "@/lib/api";

interface ReviewProviderModalProps {
  isOpen: boolean;
  provider: ServiceProvider;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
}

export default function ReviewProviderModal({
  isOpen,
  provider,
  onApprove,
  onReject,
  onClose,
}: ReviewProviderModalProps) {
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState("");

  if (!isOpen) return null;

  const handleImageClick = (imageUrl?: string) => {
    if (imageUrl) {
      setZoomImageUrl(imageUrl);
      setShowImageZoom(true);
    }
  };

  const businessName = `${provider.provider_first_name} ${provider.provider_last_name}`;

  // Fix the Valid ID URL by removing /uploads/ prefix if present
  const getCleanImageUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    
    // Remove /uploads/ prefix from Cloudinary URLs
    if (url.startsWith('/uploads/https://') || url.startsWith('/uploads/http://')) {
      return url.replace('/uploads/', '');
    }
    
    return url;
  };

  const cleanValidIdUrl = getCleanImageUrl(provider.provider_valid_id);

  // Debug: Log the ID URL
  console.log('🔍 ReviewProviderModal - Provider Valid ID URL (original):', provider.provider_valid_id);
  console.log('🔍 ReviewProviderModal - Provider Valid ID URL (cleaned):', cleanValidIdUrl);
  console.log('🔍 ReviewProviderModal - Provider Valid ID Type:', typeof provider.provider_valid_id);
  console.log('🔍 ReviewProviderModal - Full Provider Data:', provider);

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center flex-shrink-0">
            <h2 className="text-2xl font-bold text-white">Review Provider Verification</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Left Column - Provider Details */}
              <div className="space-y-6">
                {/* Profile Photo */}
                <div className="flex justify-center">
                  <SmartImage
                    src={provider.provider_profile_photo}
                    alt={businessName}
                    width={120}
                    height={120}
                    className="w-32 h-32 rounded-full object-cover ring-4 ring-blue-100 cursor-pointer hover:ring-blue-300 transition-all"
                    fallbackType="profile"
                    onClick={() => handleImageClick(provider.provider_profile_photo)}
                  />
                </div>

                {/* Provider Name & Status */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900">{businessName}</h3>
                  <p className="text-gray-600 mt-1">@{provider.provider_userName}</p>
                  <div className="mt-3 inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                    Pending Verification
                  </div>
                </div>

                {/* Profile Information */}
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <h4 className="font-semibold text-gray-900 text-lg border-b pb-2">Profile Information</h4>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900 mt-1">{provider.provider_email}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone Number</label>
                    <p className="text-gray-900 mt-1">{provider.provider_phone_number}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-gray-900 mt-1 uppercase">{provider.provider_location || "—"}</p>
                  </div>

                  {provider.provider_exact_location && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Exact Location</label>
                      <p className="text-gray-900 mt-1">{provider.provider_exact_location}</p>
                    </div>
                  )}

                  {provider.provider_birthday && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Birthday</label>
                      <p className="text-gray-900 mt-1">
                        {new Date(provider.provider_birthday).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-500">License/ULI Number</label>
                    <p className="text-gray-900 mt-1 font-mono">{provider.provider_uli || "—"}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Rating</label>
                    <p className="text-gray-900 mt-1">
                      ⭐ {provider.provider_rating ? provider.provider_rating.toFixed(1) : "No ratings yet"}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Joined Date</label>
                    <p className="text-gray-900 mt-1">
                      {new Date(provider.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - ID Document */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 text-lg border-b pb-2 mb-4">
                    Valid ID Document
                  </h4>
                  
                  {cleanValidIdUrl ? (
                    <div className="space-y-3">
                      <div 
                        className="relative cursor-pointer bg-white rounded-lg border-2 border-gray-300 hover:border-blue-500 transition-all shadow-sm hover:shadow-md overflow-hidden group"
                        onClick={() => handleImageClick(cleanValidIdUrl)}
                      >
                        <div className="p-3" style={{ minHeight: '250px', maxHeight: '350px' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cleanValidIdUrl}
                            alt="Valid ID Document"
                            crossOrigin="anonymous"
                            className="w-full h-full object-contain rounded"
                            style={{ minHeight: '250px', maxHeight: '350px' }}
                            onError={() => {
                              console.error('❌ Image failed to load:', cleanValidIdUrl);
                            }}
                            onLoad={() => {
                              console.log('✅ Image loaded successfully:', cleanValidIdUrl);
                            }}
                          />
                        </div>
                        {/* Zoom icon overlay */}
                        <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 text-center">
                        Click image to view full size
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400 bg-white rounded-lg border-2 border-dashed border-gray-300">
                      <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <p className="text-lg font-medium">No ID document submitted</p>
                    </div>
                  )}
                </div>

                {/* Verification Guidelines */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verification Guidelines
                  </h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Verify ID matches profile name</li>
                    <li>• Check ID is clear and readable</li>
                    <li>• Confirm ID is not expired</li>
                    <li>• Validate location information</li>
                    <li>• Check for any suspicious details</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t flex-shrink-0">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onReject}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Reject
            </button>
            <button
              onClick={onApprove}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Approve
            </button>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {showImageZoom && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowImageZoom(false)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setShowImageZoom(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-4xl font-bold"
            >
              ×
            </button>
            <SmartImage
              src={zoomImageUrl}
              alt="Zoomed Image"
              width={1200}
              height={800}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              fallbackType="document"
            />
          </div>
        </div>
      )}
    </>
  );
}
