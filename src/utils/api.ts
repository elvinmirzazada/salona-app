import axios, { AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config/api';
import { CreateServiceData, CreateCategoryData } from '../types/services';
import { CreateBookingData, CreateTimeOffData } from '../types/calendar';
import { clearAuthAndLogout } from './authHelpers';

declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
    skipAuthRefresh?: boolean;
  }
}

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Create a separate axios instance for refresh token (no interceptor)
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Auth API endpoints
export const authAPI = {
  // Login with email and password
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/v1/users/auth/login', {
      email,
      password,
    });
    return response;
  },

  // Signup/Register new user
  signup: async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
  }) => {
    const response = await apiClient.post('/v1/users/auth/signup', data);
    return response;
  },

  // Logout
  logout: async () => {
    const response = await apiClient.put('/v1/users/auth/logout');

    // After successful logout, clear the httpOnly cookies
    // The cookies will be removed by the server response with Set-Cookie headers
    // setting them to expire immediately

    return response;
  },

  // Get current user
  getCurrentUser: async (options?: { skipAuthRefresh?: boolean }) => {
    const response = await apiClient.get('/v1/users/me', {
      skipAuthRefresh: options?.skipAuthRefresh,
    });
    return response;
  },

  // Refresh access token
  refreshToken: async () => {
    // Use separate client without interceptor to prevent infinite loops
    const response = await refreshClient.post('/v1/users/auth/refresh-token');
    return response;
  },

  // Google OAuth - Get authorization URL
  googleAuthorize: async () => {
    const response = await apiClient.post('/v1/users/auth/google/authorize');
    return response;
  },

  // Google OAuth - Callback handler
  googleCallback: async (code: string, state: string) => {
    const response = await apiClient.get('/v1/users/auth/google/callback', {
      params: { code, state },
    });
    return response;
  },

  // Verify email with token
  verifyEmail: async (token: string) => {
    const response = await apiClient.post('/v1/users/auth/verify-email', {
      token: token,
    });
    return response;
  },
};

let refreshPromise: Promise<void> | null = null;
let logoutPromise: Promise<void> | null = null;

const isRefreshRequest = (config?: AxiosRequestConfig) => {
  const url = config?.url || '';
  return url.includes('/v1/users/auth/refresh-token');
};

const ensureSingleRefresh = async () => {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post('/v1/users/auth/refresh-token')
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const ensureLoggedOut = async () => {
  if (!logoutPromise) {
    logoutPromise = clearAuthAndLogout().finally(() => {
      logoutPromise = null;
    });
  }

  return logoutPromise;
};

// Add response interceptor for automatic token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest: AxiosRequestConfig | undefined = error.config;
    const status = error.response?.status;

    if (!originalRequest || status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest.skipAuthRefresh || originalRequest._retry || isRefreshRequest(originalRequest)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      await ensureSingleRefresh();
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      await ensureLoggedOut();
      return Promise.reject(refreshError);
    }

    try {
      return await apiClient(originalRequest);
    } catch (retryError: any) {
      if (retryError.response?.status === 401) {
        await ensureLoggedOut();
      }
      return Promise.reject(retryError);
    }
  }
);

// Services API endpoints
export const servicesAPI = {
  // Get all services
  getServices: async () => {
    const response = await apiClient.get('/v1/companies/services');
    return response.data;
  },

  // Create new service
  createService: async (serviceData: CreateServiceData, imageFile?: File) => {
    try {
      const formData = new FormData();
      formData.append('service_in', JSON.stringify(serviceData));

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await apiClient.post('/v1/services', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      // If the server returned an error response with JSON, return that
      if (error.response && error.response.data) {
        return error.response.data;
      }
      // Otherwise, re-throw the error
      throw error;
    }
  },

  // Update service
  updateService: async (serviceId: string, serviceData: CreateServiceData, imageFile?: File) => {
    try {
      const formData = new FormData();
      if (imageFile) {
        formData.append('image', imageFile);
      } else {
        serviceData.remove_image = true; // Indicate that the image should be removed if no new image is provided
      }
      formData.append('service_in', JSON.stringify(serviceData));



      const response = await apiClient.put(`/v1/services/service/${serviceId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      // If the server returned an error response with JSON, return that
      if (error.response && error.response.data) {
        return error.response.data;
      }
      // Otherwise, re-throw the error
      throw error;
    }
  },

  // Delete service
  deleteService: async (serviceId: string) => {
    const response = await apiClient.delete(`/v1/services/service/${serviceId}`);
    return response.data;
  },

  // Copy service
  copyService: async (serviceId: string) => {
    const response = await apiClient.post(`/v1/services/service/${serviceId}/copy`);
    return response.data;
  },

  // Get all categories
  getCategories: async () => {
    const response = await apiClient.get('/v1/services/companies/categories');
    return response.data;
  },

  // Create new category
  createCategory: async (categoryData: CreateCategoryData) => {
    const response = await apiClient.post('/v1/companies/categories', categoryData);
    return response.data;
  },

  // Update category
  updateCategory: async (categoryId: string, categoryData: CreateCategoryData) => {
    const response = await apiClient.put(`/v1/companies/categories/${categoryId}`, categoryData);
    return response.data;
  },

  // Delete category
  deleteCategory: async (categoryId: string) => {
    const response = await apiClient.delete(`/v1/companies/categories/${categoryId}`);
    return response.data;
  },

  // Get staff
  getStaff: async () => {
    const response = await apiClient.get('/v1/companies/users');
    return response.data;
  },
};

// Calendar API endpoints
export const calendarAPI = {
  // Get all bookings
  getBookings: async (startDate?: string, endDate?: string) => {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await apiClient.get('/v1/bookings', { params });
    return response.data;
  },

  // Create new booking
  createBooking: async (bookingData: CreateBookingData) => {
    const response = await apiClient.post('/v1/bookings/users/create_booking', bookingData);
    return response.data;
  },

  // Update booking
  updateBooking: async (bookingId: string, bookingData: Partial<CreateBookingData>) => {
    const response = await apiClient.put(`/v1/bookings/${bookingId}`, bookingData);
    return response.data;
  },

  // Update booking status
  updateBookingStatus: async (bookingId: string, status: string) => {
    const response = await apiClient.patch(`/v1/bookings/${bookingId}/status`, { status });
    return response.data;
  },

  // Mark booking as no-show
  markAsNoShow: async (bookingId: string) => {
    const response = await apiClient.patch(`/v1/bookings/${bookingId}/no-show`);
    return response.data;
  },

  // Mark booking as completed
  markAsCompleted: async (bookingId: string) => {
    const response = await apiClient.patch(`/v1/bookings/${bookingId}/complete`);
    return response.data;
  },

  // Delete booking
  deleteBooking: async (bookingId: string) => {
    const response = await apiClient.delete(`/v1/bookings/${bookingId}`);
    return response.data;
  },


  // Get all time-offs
  getTimeOffs: async () => {
    const response = await apiClient.get('/v1/users/time-offs');
    return response.data;
  },

  // Create new time-off
  createTimeOff: async (timeOffData: CreateTimeOffData) => {
    const response = await apiClient.post('/v1/users/time-offs', timeOffData);
    return response.data;
  },

  // Update time-off
  updateTimeOff: async (timeOffId: string, timeOffData: any) => {
    const response = await apiClient.patch(`/v1/users/time-offs/${timeOffId}`, timeOffData);
    return response.data;
  },

  // Delete time-off
  deleteTimeOff: async (timeOffId: string) => {
    const response = await apiClient.delete(`/v1/users/time-offs/${timeOffId}`);
    return response.data;
  },

  // Get customers
  getCustomers: async () => {
    const response = await apiClient.get('/v1/companies/customers');
    return response.data;
  },
};

export default apiClient;
