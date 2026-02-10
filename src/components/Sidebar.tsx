import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useClearCache } from '../hooks/useClearCache';
import { authAPI } from '../utils/api';
import { useCompanySettings } from '../hooks/useCompanySettings';
import '../styles/sidebar.css';

interface User {
  role?: string;
  role_status?: string;
  company_id?: string;
}

interface SidebarProps {
  user?: User | null;
  unreadNotificationsCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ user, unreadNotificationsCount = 0 }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearUser } = useUser();
  const { clearAllCache } = useClearCache();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [servicesSubmenuOpen, setServicesSubmenuOpen] = useState(false);
  const [integrationsSubmenuOpen, setIntegrationsSubmenuOpen] = useState(false);
  const [settingsSubmenuOpen, setSettingsSubmenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'owner';
  const isActive = user?.company_id && user?.role_status === 'active';

  // Fetch company settings
  const { data: companyData } = useCompanySettings();
  const company = companyData?.data;

  // Generate company initials from name
  const getCompanyInitials = (name: string): string => {
    if (!name) return 'CO';
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  // Check if current path matches menu item
  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Handle logout
  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Logout initiated...');
    try {
      // Call logout API
      await authAPI.logout();
      console.log('Logout API call successful');
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      // CRITICAL: Clear TanStack Query cache to prevent data leakage
      clearAllCache();

      // CRITICAL: Clear user context to remove stale data
      clearUser();
      console.log('User context cleared, redirecting to login...');

      // Navigate to login
      navigate('/login');
    }
  };

  // Handle fullscreen toggle
  const toggleFullscreen = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Auto-expand submenus if current path is in submenu
  useEffect(() => {
    if (isActivePath('/services') || isActivePath('/categories')) {
      setServicesSubmenuOpen(true);
    }
    if (isActivePath('/online-booking') || isActivePath('/telegram-bot')) {
      setIntegrationsSubmenuOpen(true);
    }
    if (isActivePath('/profile') || isActivePath('/company-settings')) {
      setSettingsSubmenuOpen(true);
    }
  }, [location.pathname]);

  // Determine which logo to show
  const showCompanyBranding = company && user?.company_id;
  const companyName = company?.name || '';
  const companyLogo = company?.logo_url;
  const companyInitials = getCompanyInitials(companyName);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleMobileSidebar}
        className="sidebar-mobile-toggle"
        aria-label={isMobileOpen ? "Close sidebar" : "Open sidebar"}
      >
        {!isMobileOpen ? (
          // Hamburger Menu Icon
          <svg
            style={{ width: '1.5rem', height: '1.5rem' }}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              clipRule="evenodd"
              fillRule="evenodd"
              d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
            />
          </svg>
        ) : (
          // Close X Icon
          <svg
            style={{ width: '1.5rem', height: '1.5rem' }}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`sidebar ${isMobileOpen ? 'sidebar-open' : ''}`}
        aria-label="Sidebar"
      >
        <div className="sidebar-inner">
          {/* Logo Header - Dynamic based on company */}
          <Link
            to={isAdmin ? '/dashboard' : '/calendar'}
            className="sidebar-logo"
            title={showCompanyBranding ? companyName : 'Salona'}
          >
            {showCompanyBranding ? (
              <>
                {companyLogo ? (
                  <img
                    src={companyLogo}
                    alt={companyName}
                    className="sidebar-company-logo-img"
                  />
                ) : (
                  <div className="sidebar-company-logo-initials">
                    {companyInitials}
                  </div>
                )}
                <div className="sidebar-company-info">
                  <span className="sidebar-company-name">{companyName}</span>
                  <span className="sidebar-company-subtitle">Management System</span>
                </div>
              </>
            ) : (
              <>
                <img src="/salona-icon.png" alt="Salona" className="sidebar-logo-icon" />
                <span className="sidebar-logo-text">Salona</span>
              </>
            )}
          </Link>

          {/* Main Navigation */}
          <ul className="sidebar-nav">
            {isActive && (
              <>
                {/* Dashboard (Admin/Owner only) */}
                {isAdmin && (
                  <li>
                    <Link
                      to="/dashboard"
                      className={`sidebar-nav-link ${isActivePath('/dashboard') ? 'active' : ''}`}
                    >
                      <svg className="sidebar-nav-icon" fill="currentColor" viewBox="0 0 22 21">
                        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                      </svg>
                      <span className="sidebar-nav-text">Dashboard</span>
                    </Link>
                  </li>
                )}

                {/* Create Company - Show only if no company */}
                {isAdmin && !user?.company_id && (
                  <li>
                    <Link
                      to="/company-settings"
                      className="sidebar-nav-link"
                      style={{
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%)',
                        border: '1px solid rgba(139, 92, 246, 0.3)'
                      }}
                    >
                      <svg className="sidebar-nav-icon" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      <span className="sidebar-nav-text" style={{ fontWeight: 600 }}>Create Company</span>
                    </Link>
                  </li>
                )}

                {/* Calendar */}
                <li>
                  <Link
                    to="/calendar"
                    className={`sidebar-nav-link ${isActivePath('/calendar') ? 'active' : ''}`}
                  >
                    <svg className="sidebar-nav-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm14-7.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm-5-4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm-5-4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1ZM20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4Z" />
                    </svg>
                    <span className="sidebar-nav-text">Calendar</span>
                  </Link>
                </li>

                {/* Staff */}
                <li>
                  <Link
                    to="/staff"
                    className={`sidebar-nav-link ${isActivePath('/staff') ? 'active' : ''}`}
                  >
                    <svg className="sidebar-nav-icon" fill="currentColor" viewBox="0 0 20 18">
                      <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z" />
                    </svg>
                    <span className="sidebar-nav-text">Staff</span>
                  </Link>
                </li>

                {/* Customers */}
                <li>
                  <Link
                    to="/customers"
                    className={`sidebar-nav-link ${isActivePath('/customers') ? 'active' : ''}`}
                  >
                    <svg className="sidebar-nav-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z" />
                    </svg>
                    <span className="sidebar-nav-text">Customers</span>
                  </Link>
                </li>

                {/* Services with Submenu */}
                <li>
                  <button
                    type="button"
                    className={`sidebar-nav-link ${isActivePath('/services') || isActivePath('/categories') ? 'active' : ''}`}
                    onClick={() => setServicesSubmenuOpen(!servicesSubmenuOpen)}
                  >
                    <svg className="sidebar-nav-icon" fill="currentColor" viewBox="0 0 18 20">
                      <path d="M17 5.923A1 1 0 0 0 16 5h-3V4a4 4 0 1 0-8 0v1H2a1 1 0 0 0-1 .923L.086 17.846A2 2 0 0 0 2.08 20h13.84a2 2 0 0 0 1.994-2.153L17 5.923ZM7 9a1 1 0 0 1-2 0V7h2v2Zm0-5a2 2 0 1 1 4 0v1H7V4Zm6 5a1 1 0 1 1-2 0V7h2v2Z" />
                    </svg>
                    <span className="sidebar-nav-text-flex">Services</span>
                    <svg
                      className={`sidebar-submenu-arrow ${servicesSubmenuOpen ? 'sidebar-submenu-arrow-open' : ''}`}
                      fill="none"
                      viewBox="0 0 10 6"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m1 1 4 4 4-4"
                      />
                    </svg>
                  </button>
                  <ul className={`sidebar-submenu ${servicesSubmenuOpen ? 'sidebar-submenu-open' : ''}`}>
                    <li>
                      <Link
                        to="/services"
                        className={`sidebar-submenu-link ${isActivePath('/services') ? 'active' : ''}`}
                      >
                        Services
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/categories"
                        className={`sidebar-submenu-link ${isActivePath('/categories') ? 'active' : ''}`}
                      >
                        Categories
                      </Link>
                    </li>
                  </ul>
                </li>

                {/* Membership */}
                <li>
                  <Link
                    to="/membership"
                    className={`sidebar-nav-link ${isActivePath('/membership') ? 'active' : ''}`}
                  >
                    <svg className="sidebar-nav-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11.074 4 8.442.408A.95.95 0 0 0 7.014.254L2.926 4h8.148ZM9 13v-1a4 4 0 0 1 4-4h6V6a1 1 0 0 0-1-1H1a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h17a1 1 0 0 0 1-1v-2h-6a4 4 0 0 1-4-4Z" />
                      <path d="M19 10h-6a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h6a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1Zm-4.5 3.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2ZM12.62 4h2.78L12.539.41a1.086 1.086 0 1 0-1.7 1.352L12.62 4Z" />
                    </svg>
                    <span className="sidebar-nav-text">Membership</span>
                  </Link>
                </li>

                {/* Integrations with Submenu */}
                <li>
                  <button
                    type="button"
                    className={`sidebar-nav-link ${isActivePath('/online-booking') || isActivePath('/telegram-bot') ? 'active' : ''}`}
                    onClick={() => setIntegrationsSubmenuOpen(!integrationsSubmenuOpen)}
                  >
                    <svg className="sidebar-nav-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.96 2.96 0 0 0 .13 5H5Z" />
                      <path d="M6.737 11.061a2.961 2.961 0 0 1 .81-1.515l6.117-6.116A4.839 4.839 0 0 1 16 2.141V2a1.97 1.97 0 0 0-1.933-2H7v5a2 2 0 0 1-2 2H0v11a1.969 1.969 0 0 0 1.933 2h12.134A1.97 1.97 0 0 0 16 18v-3.093l-1.546 1.546c-.413.413-.94.695-1.513.81l-3.4.679a2.947 2.947 0 0 1-1.85-.227 2.96 2.96 0 0 1-1.635-3.257l.681-3.397Z" />
                      <path d="M8.961 16a.93.93 0 0 0 .189-.019l3.4-.679a.961.961 0 0 0 .49-.263l6.118-6.117a2.884 2.884 0 0 0-4.079-4.078l-6.117 6.117a.96.96 0 0 0-.263.491l-.679 3.4A.961.961 0 0 0 8.961 16Zm7.477-9.8a.958.958 0 0 1 .68-.281.961.961 0 0 1 .682 1.644l-.315.315-1.36-1.36.313-.318Zm-5.911 5.911 4.236-4.236 1.359 1.359-4.236 4.237-1.7.339.341-1.699Z" />
                    </svg>
                    <span className="sidebar-nav-text-flex">Integrations</span>
                    <svg
                      className={`sidebar-submenu-arrow ${integrationsSubmenuOpen ? 'sidebar-submenu-arrow-open' : ''}`}
                      fill="none"
                      viewBox="0 0 10 6"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m1 1 4 4 4-4"
                      />
                    </svg>
                  </button>
                  <ul className={`sidebar-submenu ${integrationsSubmenuOpen ? 'sidebar-submenu-open' : ''}`}>
                    <li>
                      <Link
                        to="/online-booking"
                        className={`sidebar-submenu-link ${isActivePath('/online-booking') ? 'active' : ''}`}
                      >
                        Online Booking
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/telegram-bot"
                        className={`sidebar-submenu-link ${isActivePath('/telegram-bot') ? 'active' : ''}`}
                      >
                        Telegram Bot
                      </Link>
                    </li>
                  </ul>
                </li>

                {/* Notifications */}
                <li>
                  <Link
                    to="/notifications"
                    className={`sidebar-nav-link ${isActivePath('/notifications') ? 'active' : ''}`}
                  >
                    <svg className="sidebar-nav-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm3.982 13.982a1 1 0 0 1-1.414 0l-3.274-3.274A1.012 1.012 0 0 1 9 10V6a1 1 0 0 1 2 0v3.586l2.982 2.982a1 1 0 0 1 0 1.414Z" />
                    </svg>
                    <span className="sidebar-nav-text">Notifications</span>
                    {unreadNotificationsCount > 0 && (
                      <span className="sidebar-notification-badge">{unreadNotificationsCount}</span>
                    )}
                  </Link>
                </li>
              </>
            )}
          </ul>

          {/* Footer Section */}
          <ul className="sidebar-footer">
            {/* Settings with Submenu */}
            <li>
              <button
                type="button"
                className={`sidebar-nav-link ${isActivePath('/profile') || isActivePath('/company-settings') ? 'active' : ''}`}
                onClick={() => setSettingsSubmenuOpen(!settingsSubmenuOpen)}
              >
                <svg className="sidebar-nav-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 7.5h-.423l-.452-1.09.3-.3a1.5 1.5 0 0 0 0-2.121L16.01 2.575a1.5 1.5 0 0 0-2.121 0l-.3.3-1.089-.452V2A1.5 1.5 0 0 0 11 .5H9A1.5 1.5 0 0 0 7.5 2v.423l-1.09.452-.3-.3a1.5 1.5 0 0 0-2.121 0L2.576 3.99a1.5 1.5 0 0 0 0 2.121l.3.3L2.423 7.5H2A1.5 1.5 0 0 0 .5 9v2A1.5 1.5 0 0 0 2 12.5h.423l.452 1.09-.3.3a1.5 1.5 0 0 0 0 2.121l1.415 1.413a1.5 1.5 0 0 0 2.121 0l.3-.3 1.09.452V18A1.5 1.5 0 0 0 9 19.5h2a1.5 1.5 0 0 0 1.5-1.5v-.423l1.09-.452.3.3a1.5 1.5 0 0 0 2.121 0l1.415-1.414a1.5 1.5 0 0 0 0-2.121l-.3-.3.452-1.09H18a1.5 1.5 0 0 0 1.5-1.5V9A1.5 1.5 0 0 0 18 7.5Zm-8 6a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
                </svg>
                <span className="sidebar-nav-text-flex">Settings</span>
                <svg
                  className={`sidebar-submenu-arrow ${settingsSubmenuOpen ? 'sidebar-submenu-arrow-open' : ''}`}
                  fill="none"
                  viewBox="0 0 10 6"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 1 4 4 4-4"
                  />
                </svg>
              </button>
              <ul className={`sidebar-submenu ${settingsSubmenuOpen ? 'sidebar-submenu-open' : ''}`}>
                <li>
                  <Link
                    to="/profile"
                    className={`sidebar-submenu-link ${isActivePath('/profile') ? 'active' : ''}`}
                  >
                    Profile
                  </Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link
                      to="/company-settings"
                      className={`sidebar-submenu-link ${isActivePath('/company-settings') ? 'active' : ''}`}
                    >
                      Company Settings
                    </Link>
                  </li>
                )}
              </ul>
            </li>

            {/* Fullscreen (Dashboard only) */}
            {isActive && isActivePath('/dashboard') && (
              <li>
                <button onClick={toggleFullscreen} className="sidebar-nav-link">
                  {!isFullscreen ? (
                    <svg className="sidebar-nav-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                    </svg>
                  ) : (
                    <svg className="sidebar-nav-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                    </svg>
                  )}
                  <span className="sidebar-nav-text">Fullscreen</span>
                </button>
              </li>
            )}

            {/* Logout */}
            <li>
              <button onClick={handleLogout} className="sidebar-nav-link sidebar-nav-link-danger">
                <svg className="sidebar-nav-icon" fill="none" viewBox="0 0 18 16">
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M1 8h11m0 0L8 4m4 4-4 4m4-11h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3"
                  />
                </svg>
                <span className="sidebar-nav-text">Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div className="sidebar-backdrop" onClick={toggleMobileSidebar}></div>
      )}
    </>
  );
};

export default Sidebar;

