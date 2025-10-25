const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fixmo-backend-production.up.railway.app';
import { isTokenExpired } from './auth-utils';

console.log('API_BASE_URL:', API_BASE_URL); // Debug log

// Authentication interfaces
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  admin: {
    id: number;
    username: string;
    email: string;
    name: string;
    role: 'admin' | 'super_admin';
    is_active: boolean;
  };
  must_change_password: boolean;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// Authentication API functions
export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${API_BASE_URL}/api/admin/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Password change failed');
    }

    return response.json();
  },

  async logout(): Promise<void> {
    const token = this.getStoredToken();
    
    try {
      await fetch(`${API_BASE_URL}/api/admin/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    }

    // Always clear all auth data
    this.clearAuth();
  },

  getStoredToken(): string | null {
    return localStorage.getItem('token') || localStorage.getItem('adminToken') || localStorage.getItem('admin_token');
  },

  getStoredUser(): LoginResponse['admin'] | null {
    const user = localStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
  },

  storeAuth(token: string, user: LoginResponse['admin']): void {
    // Store with consistent key names
    localStorage.setItem('token', token);
    localStorage.setItem('adminToken', token);
    localStorage.setItem('admin_token', token); // Keep for backward compatibility
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('adminUser', JSON.stringify(user));
    localStorage.setItem('admin_user', JSON.stringify(user)); // Keep for backward compatibility
  },

  clearAuth(): void {
    // Clear all possible token keys
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('admin_user');
  },

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  },

  // Check if token is expired
  isTokenExpired(): boolean {
    const token = this.getStoredToken();
    if (!token) return true;

    try {
      // Decode JWT payload (basic parsing without verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token is expired (exp is in seconds)
      return payload.exp && payload.exp < currentTime;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true; // Treat invalid tokens as expired
    }
  },

  // Check if authenticated and token is not expired
  isValidAuth(): boolean {
    return this.isAuthenticated() && !this.isTokenExpired();
  }
};

// Helper function for authenticated requests with auto-logout on 401
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = authApi.getStoredToken();
  
  // Check if token is expired before making request
  if (!token || isTokenExpired(token)) {
    // Clear auth data and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please login again.');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    // Clear auth data and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please login again.');
  }

  return response;
};

// Helper function for authenticated requests
const getAuthHeaders = (): HeadersInit => {
  const token = authApi.getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Test if backend is reachable
export const testBackendConnection = async () => {
  try {
    console.log('Testing backend connection to:', API_BASE_URL);
    
    // Try to fetch with a timeout and proper error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 2 second timeout
    
    // Try a simple API endpoint
    const response = await fetch(`${API_BASE_URL}/api/admin/users?page=1&limit=1`, {
      method: 'GET',
      signal: controller.signal,
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
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
    
    const response = await makeAuthenticatedRequest(url);
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
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/admin/users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  async verifyUser(userId: number) {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/admin/users/${userId}/verify`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Failed to verify user');
    return response.json();
  },

  async rejectUser(userId: number, reason: string) {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/reject`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error('Failed to reject user');
    return response.json();
  },

  async activateUser(userId: number) {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/activate`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to activate user');
    return response.json();
  },

  async deactivateUser(userId: number, reason?: string) {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/deactivate`, {
      method: 'PUT',
      headers: getAuthHeaders(),
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
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
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
    const response = await fetch(`${API_BASE_URL}/api/admin/providers/${providerId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch provider');
    return response.json();
  },

  async verifyProvider(providerId: string, verified: boolean) {
    const endpoint = verified ? 'verify' : 'reject';
    const response = await fetch(`${API_BASE_URL}/api/admin/providers/${providerId}/${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to verify provider');
    return response.json();
  },

  async rejectProvider(providerId: string, reason: string) {
    const response = await fetch(`${API_BASE_URL}/api/admin/providers/${providerId}/reject`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error('Failed to reject provider');
    return response.json();
  },

  async updateProviderStatus(providerId: string, status: 'active' | 'inactive') {
    const endpoint = status === 'active' ? 'activate' : 'deactivate';
    const response = await fetch(`${API_BASE_URL}/api/admin/providers/${providerId}/${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to update provider status');
    return response.json();
  },

  async activateProvider(providerId: number) {
    const response = await fetch(`${API_BASE_URL}/api/admin/providers/${providerId}/activate`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to activate provider');
    return response.json();
  },

  async deactivateProvider(providerId: number, reason?: string) {
    const response = await fetch(`${API_BASE_URL}/api/admin/providers/${providerId}/deactivate`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: reason ? JSON.stringify({ reason }) : undefined,
    });
    if (!response.ok) throw new Error('Failed to deactivate provider');
    return response.json();
  },

  // Certificate Management
  async getCertificates(filters: { page?: number; limit?: number; status?: string; provider_id?: number; search?: string } = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.append(key, String(value));
    });
    
    const response = await fetch(`${API_BASE_URL}/api/admin/certificates?${params}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch certificates');
    return response.json();
  },

  async getCertificateById(certificateId: number) {
    const response = await fetch(`${API_BASE_URL}/api/admin/certificates/${certificateId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch certificate');
    return response.json();
  },

  async approveCertificate(certificateId: number, adminNotes?: string) {
    const response = await fetch(`${API_BASE_URL}/api/admin/certificates/${certificateId}/approve`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ adminNotes: adminNotes || 'Certificate verified and approved' }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to approve certificate');
    }
    return response.json();
  },

  async rejectCertificate(certificateId: number, reason: string, adminNotes?: string) {
    const response = await fetch(`${API_BASE_URL}/api/admin/certificates/${certificateId}/reject`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ 
        reason,
        adminNotes: adminNotes || ''
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reject certificate');
    }
    return response.json();
  },

  // Dashboard Stats - Aggregate from existing endpoints
  async getDashboardStats() {
    console.log('Fetching dashboard stats by aggregating data...'); // Debug log
    
    try {
      // Fetch data from multiple endpoints to calculate stats
      const [usersResponse, providersResponse, certificatesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/users`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api/admin/providers`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/api/admin/certificates`, { headers: getAuthHeaders() })
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
        totalCertificates: Array.isArray(certificates.certificates) 
          ? certificates.certificates.length
          : (Array.isArray(certificates) ? certificates.length : 0),
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
        totalCertificates: 0,
      };
    }
  },

  async getRecentActivity() {
    const url = `${API_BASE_URL}/api/admin/recent-activity`;
    console.log('Fetching recent activity from:', url); // Debug log
    
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
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

  // Admin Management (Super Admin Only)
  async getAdmins() {
    console.log('Fetching admins from:', `${API_BASE_URL}/api/admin/`);
    const response = await fetch(`${API_BASE_URL}/api/admin/`, {
      headers: getAuthHeaders(),
    });
    console.log('Admins response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Admins fetch error:', errorText);
      throw new Error(`Failed to fetch admins: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Admins data received:', data);
    return data;
  },

  async getAdminById(adminId: number) {
    console.log('Fetching admin by ID:', adminId);
    const response = await fetch(`${API_BASE_URL}/api/admin/${adminId}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      console.error('Admin fetch error:', response.status);
      return null; // Return null if admin not found
    }
    
    const data = await response.json();
    return data;
  },

  async inviteAdmin(adminData: { email: string; name: string; role: 'admin' | 'super_admin' }) {
    const response = await fetch(`${API_BASE_URL}/api/admin/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(adminData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to invite admin');
    }
    return response.json();
  },

  async toggleAdminStatus(adminId: number, isActive: boolean) {
    const response = await fetch(`${API_BASE_URL}/api/admin/${adminId}/toggle-status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_active: isActive }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to toggle admin status');
    }
    return response.json();
  },

  async resetAdminPassword(adminId: number, reason?: string) {
    const response = await fetch(`${API_BASE_URL}/api/admin/${adminId}/reset-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: reason ? JSON.stringify({ reason }) : undefined,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reset admin password');
    }
    return response.json();
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
  verification_status?: string;
  userName: string;
  is_activated: boolean;
  birthday?: string;
  exact_location?: string;
  verified_by_admin_id?: number;
  deactivated_by_admin_id?: number;
  verification_reviewed_at?: string;
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
  verification_status?: string;
  created_at: string;
  provider_rating: number;
  provider_location?: string;
  provider_uli: string;
  provider_userName: string;
  provider_isActivated: boolean;
  provider_birthday?: string;
  provider_exact_location?: string;
  verified_by_admin_id?: number;
  deactivated_by_admin_id?: number;
  verification_reviewed_at?: string;
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
  reviewed_by_admin_id?: number;
  reviewed_at?: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeServiceProviders: number;
  pendingVerifications: number;
  totalCertificates: number;
}

export interface Admin {
  id: number;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  last_login?: string;
}

// Appointment interfaces
export interface Appointment {
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
    service_id: number;
    service_title: string;
    service_startingprice: number;
  };
}

export interface BackjobApplication {
  backjob_id: number;
  appointment_id: number;
  customer_id: number;
  provider_id: number;
  status: string;
  reason: string;
  evidence: unknown;
  provider_dispute_reason: string | null;
  provider_dispute_evidence: unknown;
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
    provider_uli?: string;
    provider_location?: string;
    provider_exact_location?: string;
  };
}

export interface AppointmentFilters {
  page?: number;
  limit?: number;
  status?: string;
  provider_id?: number;
  customer_id?: number;
  from_date?: string;
  to_date?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface BackjobFilters {
  status?: string;
  page?: number;
  limit?: number;
}

export interface AdminCancelRequest {
  cancellation_reason: string;
  admin_notes?: string;
  cancelled_by: string;
  penalty_applied?: boolean;
}

export interface BackjobUpdateRequest {
  action: 'approve' | 'cancel-by-admin' | 'cancel-by-user';
  admin_notes: string;
}

export interface BackjobsResponse {
  success: boolean;
  data: BackjobApplication[];
  pagination?: {
    total: number;
    total_pages: number;
    current_page: number;
    per_page: number;
  };
}

export interface DisputeResponse {
  success: boolean;
  message: string;
  data: BackjobApplication;
}

export interface DashboardStats {
  totalUsers: number;
  totalProviders: number;
  totalAppointments: number;
  totalRevenue: number;
  pendingVerifications: number;
  activeDisputes: number;
  [key: string]: number | string;
}

// Appointments API
export const appointmentsApi = {
  async getAll(filters: AppointmentFilters = {}): Promise<{ 
    success: boolean; 
    data: Appointment[]; 
    pagination: { 
      total: number; 
      page: number; 
      limit: number; 
      total_pages: number; 
    } 
  }> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/appointments?${queryParams.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch appointments');
    }

    return response.json();
  },

  async getById(appointmentId: number): Promise<Appointment> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/appointments/${appointmentId}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch appointment');
    }

    return response.json();
  },

  async adminCancel(appointmentId: number, data: AdminCancelRequest): Promise<{ success: boolean; message: string; data: Appointment }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/appointments/${appointmentId}/admin-cancel`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel appointment');
    }

    return response.json();
  },

  async getBackjobs(filters: BackjobFilters = {}): Promise<BackjobsResponse> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      // Use the exact endpoint from the API documentation
      const url = `${API_BASE_URL}/api/appointments/backjobs${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('Fetching backjobs from:', url);
      console.log('Query params:', Object.fromEntries(queryParams));

      const response = await makeAuthenticatedRequest(url);

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText || 'Failed to fetch backjobs' };
        }
        throw new Error(error.message || `HTTP ${response.status}: Failed to fetch backjobs`);
      }

      const data = await response.json();
      console.log('Backjobs data received:', data);
      return data;
    } catch (error) {
      console.error('Error in getBackjobs:', error);
      throw error;
    }
  },

  async updateBackjob(backjobId: number, data: BackjobUpdateRequest): Promise<{ success: boolean; message: string; data: BackjobApplication }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/appointments/backjobs/${backjobId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update backjob');
    }

    return response.json();
  },

  async approveDispute(backjobId: number, adminNotes: string): Promise<DisputeResponse> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/appointments/backjobs/${backjobId}/approve-dispute`,
      {
        method: 'POST',
        body: JSON.stringify({ admin_notes: adminNotes }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to approve dispute');
    }

    return response.json();
  },

  async rejectDispute(backjobId: number, adminNotes: string): Promise<DisputeResponse> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/appointments/backjobs/${backjobId}/reject-dispute`,
      {
        method: 'POST',
        body: JSON.stringify({ admin_notes: adminNotes }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reject dispute');
    }

    return response.json();
  },

  async getStats(): Promise<DashboardStats> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/appointments/stats`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch appointment stats');
    }

    return response.json();
  },
};

// Export API
export interface ExportFilters {
  format: 'csv' | 'pdf';
  [key: string]: string | undefined;
}

export const exportApi = {
  async exportUsers(filters: ExportFilters): Promise<Blob> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/admin/export/users?${queryParams.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to export users');
    }

    return response.blob();
  },

  async exportProviders(filters: ExportFilters): Promise<Blob> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/admin/export/providers?${queryParams.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to export providers');
    }

    return response.blob();
  },

  async exportCertificates(filters: ExportFilters): Promise<Blob> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/admin/export/certificates?${queryParams.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to export certificates');
    }

    return response.blob();
  },

  async exportAppointments(filters: ExportFilters): Promise<Blob> {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/admin/export/appointments?${queryParams.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to export appointments');
    }

    return response.blob();
  },
};

// Admin cache for tracking
const adminCache: Map<number, { name: string; email: string }> = new Map();

export const getAdminName = async (adminId: number | null | undefined): Promise<string> => {
  if (!adminId) return '—';
  
  // Check cache first
  if (adminCache.has(adminId)) {
    const admin = adminCache.get(adminId)!;
    return `${admin.name} (ID: ${adminId})`;
  }
  
  // Fetch from API
  try {
    const admin = await adminApi.getAdminById(adminId);
    if (admin) {
      adminCache.set(adminId, { name: admin.name, email: admin.email });
      return `${admin.name} (ID: ${adminId})`;
    }
  } catch (error) {
    console.error('Error fetching admin:', error);
  }
  
  return `Admin ID: ${adminId}`;
};
