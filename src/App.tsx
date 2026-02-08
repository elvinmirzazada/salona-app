import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider } from './contexts/UserContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CheckEmailPage from './pages/CheckEmailPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import StaffPage from './pages/StaffPage';
import CustomersPage from './pages/CustomersPage';
import ServicesPage from './pages/ServicesPage';
import CategoriesPage from './pages/CategoriesPage';
import MembershipPage from './pages/MembershipPage';
import OnlineBookingPage from './pages/OnlineBookingPage';
import TelegramBotPage from './pages/TelegramBotPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import CompanySettingsPage from './pages/CompanySettingsPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import PublicBookingPage from './pages/PublicBookingPage';
import BookingPrivacyPage from './pages/BookingPrivacyPage';
import BookingTermsPage from './pages/BookingTermsPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import './styles/global.css';
import './styles/navigation.css';

// Create a client with 1-day cache time
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 24 * 60 * 60 * 1000, // 1 day in milliseconds
      gcTime: 24 * 60 * 60 * 1000, // 1 day garbage collection time
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: false, // Don't refetch on reconnect
      retry: 1, // Retry failed requests once
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/check-email" element={<CheckEmailPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            
            {/* Public Booking - No Authentication Required */}
            <Route path="/booking/:companySlug" element={<PublicBookingPage />} />
            <Route path="/booking/:companySlug/confirmation" element={<BookingConfirmationPage />} />
            <Route path="/booking-privacy" element={<BookingPrivacyPage />} />
            <Route path="/booking-terms" element={<BookingTermsPage />} />

            {/* Protected Routes - Require Authentication */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="/staff" element={<ProtectedRoute><StaffPage /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
            <Route path="/services" element={<ProtectedRoute><ServicesPage /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
            <Route path="/membership" element={<ProtectedRoute><MembershipPage /></ProtectedRoute>} />
            <Route path="/online-booking" element={<ProtectedRoute><OnlineBookingPage /></ProtectedRoute>} />
            <Route path="/telegram-bot" element={<ProtectedRoute><TelegramBotPage /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/company-settings" element={<ProtectedRoute><CompanySettingsPage /></ProtectedRoute>} />
          </Routes>
        </Router>
      </UserProvider>
    </QueryClientProvider>
  );
};

export default App;

