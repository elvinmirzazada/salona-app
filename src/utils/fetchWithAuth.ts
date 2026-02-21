import { API_BASE_URL } from '../config/api';
import { clearAuthAndLogout } from './authHelpers';

/**
 * Fetch wrapper that handles 401 errors with automatic token refresh
 * If token refresh fails, it logs out the user and clears cookies
 */

// Track if we're currently refreshing to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshSubscribers: ((error?: any) => void)[] = [];

// Helper to add requests to queue while token is being refreshed
const subscribeTokenRefresh = (callback: (error?: any) => void) => {
  refreshSubscribers.push(callback);
};

// Helper to execute all queued requests after token refresh
const onTokenRefreshed = (error?: any) => {
  refreshSubscribers.forEach(callback => callback(error));
  refreshSubscribers = [];
};

// Helper function to refresh token
const refreshToken = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/users/auth/refresh-token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    return false;
  }
};

/**
 * Fetch wrapper with automatic token refresh on 401
 * @param input - URL or Request object
 * @param init - RequestInit options
 * @returns Promise<Response>
 */
export const fetchWithAuth = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  // Ensure credentials are included
  const config: RequestInit = {
    ...init,
    credentials: 'include',
  };

  // Make the initial request
  let response = await fetch(input, config);

  // Handle 401 response
  if (response.status === 401) {
    // If we're already refreshing, wait for the refresh to complete
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(async (error) => {
          if (error) {
            reject(error);
          } else {
            // Retry the original request after token refresh
            try {
              const retryResponse = await fetch(input, config);
              resolve(retryResponse);
            } catch (retryError) {
              reject(retryError);
            }
          }
        });
      });
    }

    // Start refreshing
    isRefreshing = true;

    try {
      const refreshSuccess = await refreshToken();

      if (refreshSuccess) {
        // Token refresh successful, notify all waiting requests
        onTokenRefreshed();
        isRefreshing = false;

        // Retry the original request
        response = await fetch(input, config);
        return response;
      } else {
        // Token refresh failed, logout and clear cookies
        await clearAuthAndLogout();
        onTokenRefreshed(new Error('Token refresh failed'));
        isRefreshing = false;
        throw new Error('Authentication failed');
      }
    } catch (error) {
      // Token refresh failed with an error, logout and clear cookies
      console.error('Token refresh failed:', error);
      await clearAuthAndLogout();
      onTokenRefreshed(error);
      isRefreshing = false;
      throw error;
    }
  }

  return response;
};
