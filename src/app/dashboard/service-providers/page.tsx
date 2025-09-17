'use client';

import { useState, useEffect } from 'react';
import { adminApi, testBackendConnection, ServiceProvider } from '@/lib/api';
import { getImageUrl, handleImageError, getPlaceholderImage, shouldUseNextImage } from '@/lib/image-utils';

export default function ServiceProvidersPage() {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all');
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      
      // Skip connection test and try real API directly
      console.log('🚀 Fetching service providers from real API...');
      const data = await adminApi.getProviders();
      console.log('✅ Service Providers API Response:', data);
      
      setBackendStatus('connected');
      const providersArray = data.providers || data || [];
      console.log('👨‍🔧 Providers received:', providersArray.length);
      setProviders(providersArray);
    } catch (error) {
      console.error("❌ Failed to fetch service providers:", error);
      setBackendStatus('disconnected');
      
      // Use mock data as fallback
      console.warn('📋 Using mock data for service providers');
      setProviders([
        {
          provider_id: 1,
          provider_first_name: "Mike",
          provider_last_name: "Johnson",
          provider_email: "mike.johnson@example.com",
          provider_phone_number: "+1234567892",
          provider_profile_photo: "https://res.cloudinary.com/demo/image/upload/c_scale,w_100,h_100/v1/sample.jpg",
          provider_valid_id: "https://res.cloudinary.com/demo/image/upload/c_scale,w_300,h_200/v1/sample.jpg",
          provider_isVerified: true,
          created_at: new Date().toISOString(),
          provider_rating: 4.8,
          provider_location: "San Francisco",
          provider_uli: "SF12345",
          provider_userName: "mikej",
          provider_isActivated: true,
          provider_birthday: "1985-03-20",
          provider_exact_location: "789 Tech St, San Francisco"
        },
        {
          provider_id: 2,
          provider_first_name: "Sarah",
          provider_last_name: "Wilson",
          provider_email: "sarah.wilson@example.com",
          provider_phone_number: "+1234567893",
          provider_profile_photo: "https://res.cloudinary.com/demo/image/upload/c_scale,w_100,h_100/woman.jpg",
          provider_valid_id: "https://res.cloudinary.com/demo/image/upload/c_scale,w_300,h_200/sample.jpg",
          provider_isVerified: false,
          created_at: new Date().toISOString(),
          provider_rating: 4.2,
          provider_location: "Seattle",
          provider_uli: "SEA67890",
          provider_userName: "sarahw",
          provider_isActivated: true,
          provider_birthday: "1988-07-12",
          provider_exact_location: "321 Pine Ave, Seattle"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyProvider = async (providerId: string, verified: boolean) => {
    try {
      await adminApi.verifyProvider(providerId, verified);
      await fetchProviders(); // Refresh the list
    } catch (error) {
      console.error('Error verifying provider:', error);
    }
  };

  const handleStatusChange = async (providerId: string, status: 'active' | 'inactive') => {
    try {
      await adminApi.updateProviderStatus(providerId, status);
      await fetchProviders(); // Refresh the list
    } catch (error) {
      console.error('Error updating provider status:', error);
    }
  };

  const filteredProviders = providers.filter(provider => {
    const fullName = `${provider.provider_first_name} ${provider.provider_last_name}`;
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.provider_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.provider_uli.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'verified' && provider.provider_isVerified) ||
                         (filterStatus === 'pending' && !provider.provider_isVerified && provider.provider_isActivated) ||
                         (filterStatus === 'rejected' && !provider.provider_isVerified && !provider.provider_isActivated);
    
    return matchesSearch && matchesFilter;
  });

  const viewProviderDetails = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Providers</h1>
          <p className="text-gray-600 mt-2">Manage and verify service providers</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow">
          <span className="text-sm text-gray-500">Total Providers: </span>
          <span className="font-semibold text-blue-600">{providers.length}</span>
        </div>
      </div>

      {/* Backend Status Indicator */}
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${
          backendStatus === 'connected' ? 'bg-green-500' : 
          backendStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
        }`}></div>
        <span className="text-sm text-gray-600">
          Backend: {backendStatus === 'connected' ? 'Connected' : 
                   backendStatus === 'disconnected' ? 'Disconnected (using mock data)' : 'Checking...'}
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search providers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Providers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ULI & Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProviders.map((provider) => {
                const fullName = `${provider.provider_first_name} ${provider.provider_last_name}`;
                return (
                <tr key={provider.provider_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={getImageUrl(provider.provider_profile_photo) || getPlaceholderImage('profile')}
                          alt={fullName}
                          onError={(e) => handleImageError(e, 'profile')}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {fullName}
                        </div>
                        <div className="text-sm text-gray-500">{provider.provider_email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{provider.provider_uli}</div>
                    <div className="text-sm text-gray-500">{provider.provider_location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Service Provider
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900">{provider.provider_rating.toFixed(1)}</span>
                      <svg className="w-4 h-4 text-yellow-400 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      provider.provider_isActivated 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {provider.provider_isActivated ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      provider.provider_isVerified 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {provider.provider_isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => viewProviderDetails(provider)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    {!provider.provider_isVerified && (
                      <button
                        onClick={() => handleVerifyProvider(provider.provider_id.toString(), true)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Verify
                      </button>
                    )}
                    {provider.provider_isVerified && (
                      <button
                        onClick={() => handleVerifyProvider(provider.provider_id.toString(), false)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provider Details Modal */}
      {showModal && selectedProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Provider Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                        <p className="text-gray-900">{`${selectedProvider.provider_first_name} ${selectedProvider.provider_last_name}`}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900">{selectedProvider.provider_email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-gray-900">{selectedProvider.provider_phone_number}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Username</label>
                        <p className="text-gray-900">{selectedProvider.provider_userName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Rating</label>
                        <p className="text-gray-900">{selectedProvider.provider_rating.toFixed(1)} ⭐</p>
                      </div>
                      {selectedProvider.provider_birthday && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Birthday</label>
                          <p className="text-gray-900">{new Date(selectedProvider.provider_birthday).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">ULI (Unique Location Identifier)</label>
                        <p className="text-gray-900">{selectedProvider.provider_uli}</p>
                      </div>
                      {selectedProvider.provider_location && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Location</label>
                          <p className="text-gray-900">{selectedProvider.provider_location}</p>
                        </div>
                      )}
                      {selectedProvider.provider_exact_location && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Exact Location</label>
                          <p className="text-gray-900">{selectedProvider.provider_exact_location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Profile Photo</label>
                        <img
                          src={getImageUrl(selectedProvider.provider_profile_photo) || getPlaceholderImage('profile')}
                          alt="Profile"
                          className="w-32 h-32 object-cover rounded-lg border"
                          onError={(e) => handleImageError(e, 'profile')}
                        />
                      </div>
                      {selectedProvider.provider_valid_id && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Valid ID</label>
                          <img
                            src={getImageUrl(selectedProvider.provider_valid_id) || getPlaceholderImage('document')}
                            alt="Valid ID"
                            className="w-64 h-40 object-cover rounded-lg border"
                            onError={(e) => handleImageError(e, 'document')}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                    <div className="space-y-3">
                      {!selectedProvider.provider_isVerified ? (
                        <button
                          onClick={() => {
                            handleVerifyProvider(selectedProvider.provider_id.toString(), true);
                            setShowModal(false);
                          }}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                        >
                          Verify Provider
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            handleVerifyProvider(selectedProvider.provider_id.toString(), false);
                            setShowModal(false);
                          }}
                          className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                        >
                          Revoke Verification
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          handleStatusChange(
                            selectedProvider.provider_id.toString(), 
                            selectedProvider.provider_isActivated ? 'inactive' : 'active'
                          );
                          setShowModal(false);
                        }}
                        className={`w-full px-4 py-2 rounded-md ${
                          selectedProvider.provider_isActivated
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {selectedProvider.provider_isActivated ? 'Deactivate' : 'Activate'} Provider
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredProviders.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No service providers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No service providers have been registered yet.'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
