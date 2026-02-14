import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../utils/api';
import { API_BASE_URL } from '../config/api';
import { fetchWithAuth } from '../utils/fetchWithAuth';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position?: string;
  languages?: string;
  profile_photo_url?: string;
  role?: string;
  role_status?: string;
  company_id?: string;
  status?: string;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  unreadNotificationsCount: number;
  refreshUser: () => Promise<void>;
  clearUser: () => void;
  setUserData: (user: User | null) => void;
  refreshNotificationsCount: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const fetchNotificationsCount = async () => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/v1/notifications`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const unreadCount = data.data.filter((n: any) => n.status !== 'read').length;
          setUnreadNotificationsCount(unreadCount);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications count:', error);
      setUnreadNotificationsCount(0);
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.getCurrentUser();
      console.log('UserContext - Full API response:', response);

      if (response.data && response.data.data) {
        let userData = null;
        let userRole = null;
        let userRoleStatus = null;
        let userCompanyId = null;

        // When company exists: data.data.user contains user info
        if (response.data.data.user) {
          userData = response.data.data.user;
          userRole = response.data.data.role;
          userRoleStatus = response.data.data.status;
          userCompanyId = response.data.data.company_id;
        } else {
          // When no company: data.data contains user info directly
          userData = response.data.data;
          userRole = userData.role;
          userRoleStatus = userData.role_status || userData.status;
          userCompanyId = userData.company_id;
        }

        // Merge all user data
        const fullUserData: User = {
          ...userData,
          role: userRole || userData.role,
          role_status: userRoleStatus || userData.role_status || userData.status,
          company_id: userCompanyId || userData.company_id
        };

        console.log('UserContext - Extracted user data:', fullUserData);
        setUser(fullUserData);

        // Fetch notifications count if user is authenticated
        if (fullUserData) {
          await fetchNotificationsCount();
        }
      } else {
        console.error('UserContext - Invalid response structure');
        setUser(null);
        setError('Failed to load user data');
      }
    } catch (err: any) {
      console.error('UserContext - Failed to fetch user:', err);
      
      // If it's a 401 error, clear the user data
      if (err?.response?.status === 401) {
        console.log('UserContext - User not authenticated (401)');
        setUser(null);
        setError(null); // Don't show error for unauthenticated state
      } else {
        setError('Failed to fetch user data');
      }
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  useEffect(() => {
    // Check if current path is a public route that should skip authentication
    const isPublicRoute = () => {
      const pathname = window.location.pathname;
      const publicPaths = [
        '/booking/',
        '/terms-of-service',
        '/privacy-policy',
      ];

      // Check if pathname starts with any public path
      return publicPaths.some(path => pathname.startsWith(path));
    };

    // Only fetch on initial mount and skip for public routes
    if (!isInitialized && !isPublicRoute()) {
      fetchUserData();
    } else if (!isInitialized && isPublicRoute()) {
      // For public routes, just mark as initialized without fetching user
      setLoading(false);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const refreshUser = async () => {
    console.log('UserContext - Refreshing user data...');
    await fetchUserData();
  };

  const refreshNotificationsCount = async () => {
    console.log('UserContext - Refreshing notifications count...');
    await fetchNotificationsCount();
  };

  const clearUser = () => {
    console.log('UserContext - Clearing user data');
    setUser(null);
    setError(null);
    setLoading(false);
    setUnreadNotificationsCount(0);
  };

  const setUserData = (userData: User | null) => {
    console.log('UserContext - Setting user data directly:', userData);
    setUser(userData);
  };

  return (
    <UserContext.Provider value={{ user, loading, error, unreadNotificationsCount, refreshUser, clearUser, setUserData, refreshNotificationsCount }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

