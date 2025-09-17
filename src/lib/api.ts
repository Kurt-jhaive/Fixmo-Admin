const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

console.log('API_BASE_URL:', API_BASE_URL); // Debug log

// Test if backend is reachable
export const testBackendConnection = async () => {
  try {
    console.log('Testing backend connection to:', API_BASE_URL);
    
    // Try to fetch with a timeout and proper error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    // Try a simple API endpoint
    const response = await fetch(`${API_BASE_URL}/api/admin/users?page=1&limit=1`, {
      method: 'GET',
      signal: controller.signal,
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    console.log('Backend connection test - Status:', response.status);
    
    // Consider any response (even errors) as "connected"
    return response.status < 500; // Only network/server errors are "disconnected"
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return false;
  }
};

// API utility functions for admin operations
export const adminApi = {
  // User Management
  async getUsers(filters: { page?: number; limit?: number; search?: string; verified?: boolean; active?: boolean } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    
    const url = `${API_BASE_URL}/api/admin/users?${params}`;
    console.log('Fetching users from:', url); // Debug log
    
    const response = await fetch(url);
    console.log('Users response status:', response.status); // Debug log
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Users fetch error:', errorText); // Debug log
      throw new Error(`Failed to fetch users: ${response.status} ${errorText}`);
    }
    const data = await response.json();
    console.log('Users data received:', data); // Debug log
    return data;
  },

  async getUserById(userId: number) {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  async verifyUser(userId: number) {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/verify`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Failed to verify user');
    return response.json();
  },

  async rejectUser(userId: number, reason: string) {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error('Failed to reject user');
    return response.json();
  },

  async activateUser(userId: number) {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/activate`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Failed to activate user');
    return response.json();
  },

  async deactivateUser(userId: number, reason?: string) {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/deactivate`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: reason ? JSON.stringify({ reason }) : undefined,
    });
    if (!response.ok) throw new Error('Failed to deactivate user');
    return response.json();
  },

  // Service Provider Management
  async getProviders(filters: { page?: number; limit?: number; search?: string; verified?: boolean; active?: boolean } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    
    const url = `${API_BASE_URL}/api/admin/providers?${params}`;
    console.log('Fetching providers from:', url); // Debug log
    
    const response = await fetch(url);
    console.log('Providers response status:', response.status); // Debug log
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Providers fetch error:', errorText); // Debug log
      throw new Error(`Failed to fetch providers: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Providers data received:', data); // Debug log
    return data;
  },

  async getProviderById(providerId: number) {
    const response = await fetch(`${API_BASE_URL}/api/admin/providers/${providerId}`);
    if (!response.ok) throw new Error('Failed to fetch provider');
    return response.json();
  },

  async verifyProvider(providerId: string, verified: boolean) {
    const endpoint = verified ? 'verify' : 'reject';
    const response = await fetch(`${API_BASE_URL}/api/admin/providers/${providerId}/${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to verify provider');
    return response.json();
  },

  async rejectProvider(providerId: string, reason: string) {
    const response = await fetch(`${API_BASE_URL}/api/admin/providers/${providerId}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error('Failed to reject provider');
    return response.json();
  },

  async updateProviderStatus(providerId: string, status: 'active' | 'inactive') {
    const endpoint = status === 'active' ? 'activate' : 'deactivate';
    const response = await fetch(`${API_BASE_URL}/api/admin/providers/${providerId}/${endpoint}`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Failed to update provider status');
    return response.json();
  },

  async activateProvider(providerId: number) {
    const response = await fetch(`${API_BASE_URL}/api/admin/providers/${providerId}/activate`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Failed to activate provider');
    return response.json();
  },

  async deactivateProvider(providerId: number, reason?: string) {
    const response = await fetch(`${API_BASE_URL}/api/admin/providers/${providerId}/deactivate`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: reason ? JSON.stringify({ reason }) : undefined,
    });
    if (!response.ok) throw new Error('Failed to deactivate provider');
    return response.json();
  },

  // Certificate Management
  async getCertificates(filters: { page?: number; limit?: number; status?: string; provider_id?: number } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    
    const response = await fetch(`${API_BASE_URL}/api/admin/certificates?${params}`);
    if (!response.ok) throw new Error('Failed to fetch certificates');
    return response.json();
  },

  async getCertificateById(certificateId: number) {
    const response = await fetch(`${API_BASE_URL}/api/admin/certificates/${certificateId}`);
    if (!response.ok) throw new Error('Failed to fetch certificate');
    return response.json();
  },

  async approveCertificate(certificateId: number) {
    const response = await fetch(`${API_BASE_URL}/api/admin/certificates/${certificateId}/approve`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Failed to approve certificate');
    return response.json();
  },

  async rejectCertificate(certificateId: number, reason?: string) {
    const response = await fetch(`${API_BASE_URL}/api/admin/certificates/${certificateId}/reject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: reason ? JSON.stringify({ reason }) : undefined,
    });
    if (!response.ok) throw new Error('Failed to reject certificate');
    return response.json();
  },

  // Dashboard Stats - Aggregate from existing endpoints
  async getDashboardStats() {
    console.log('Fetching dashboard stats by aggregating data...'); // Debug log
    
    try {
      // Fetch data from multiple endpoints to calculate stats
      const [usersResponse, providersResponse, certificatesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/users`),
        fetch(`${API_BASE_URL}/api/admin/providers`),
        fetch(`${API_BASE_URL}/api/admin/certificates`)
      ]);

      console.log('Users response status:', usersResponse.status);
      console.log('Providers response status:', providersResponse.status);
      console.log('Certificates response status:', certificatesResponse.status);

      // Handle responses
      const users = usersResponse.ok ? await usersResponse.json() : { users: [] };
      const providers = providersResponse.ok ? await providersResponse.json() : { providers: [] };
      const certificates = certificatesResponse.ok ? await certificatesResponse.json() : { certificates: [] };

      console.log('Users data:', users);
      console.log('Providers data:', providers);
      console.log('Certificates data:', certificates);

      // Calculate stats
      const stats = {
        totalUsers: Array.isArray(users.users) ? users.users.length : (Array.isArray(users) ? users.length : 0),
        activeServiceProviders: Array.isArray(providers.providers) 
          ? providers.providers.filter((p: ServiceProvider) => p.provider_isActivated).length 
          : (Array.isArray(providers) ? providers.filter((p: ServiceProvider) => p.provider_isActivated).length : 0),
        pendingVerifications: Array.isArray(providers.providers)
          ? providers.providers.filter((p: ServiceProvider) => !p.provider_isVerified).length
          : (Array.isArray(providers) ? providers.filter((p: ServiceProvider) => !p.provider_isVerified).length : 0),
        certificatesIssued: Array.isArray(certificates.certificates) 
          ? certificates.certificates.filter((c: Certificate) => c.certificate_status === 'approved').length
          : (Array.isArray(certificates) ? certificates.filter((c: Certificate) => c.certificate_status === 'approved').length : 0),
      };

      console.log('Calculated dashboard stats:', stats);
      return stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return fallback stats
      return {
        totalUsers: 0,
        activeServiceProviders: 0,
        pendingVerifications: 0,
        certificatesIssued: 0,
      };
    }
  },

  async getRecentActivity() {
    const url = `${API_BASE_URL}/api/admin/recent-activity`;
    console.log('Fetching recent activity from:', url); // Debug log
    
    const response = await fetch(url);
    console.log('Recent activity response status:', response.status); // Debug log
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Recent activity fetch error:', errorText); // Debug log
      throw new Error(`Failed to fetch recent activity: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Recent activity data received:', data); // Debug log
    return data;
  },
};

// Types for better TypeScript support
export interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  profile_photo?: string;
  valid_id?: string;
  user_location?: string;
  created_at: string;
  is_verified: boolean;
  userName: string;
  is_activated: boolean;
  birthday?: string;
  exact_location?: string;
}

export interface ServiceProvider {
  provider_id: number;
  provider_first_name: string;
  provider_last_name: string;
  provider_email: string;
  provider_phone_number: string;
  provider_profile_photo?: string;
  provider_valid_id?: string;
  provider_isVerified: boolean;
  created_at: string;
  provider_rating: number;
  provider_location?: string;
  provider_uli: string;
  provider_userName: string;
  provider_isActivated: boolean;
  provider_birthday?: string;
  provider_exact_location?: string;
}

export interface Certificate {
  certificate_id: number;
  certificate_name: string;
  certificate_number: string;
  certificate_file_path?: string;
  certificate_status: string;
  provider_id: number;
  expiry_date?: string;
  created_at: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeServiceProviders: number;
  pendingVerifications: number;
  certificatesIssued: number;
}
