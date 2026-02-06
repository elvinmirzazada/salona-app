import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useUser } from '../contexts/UserContext';
import { API_BASE_URL } from '../config/api';
import '../styles/notifications.css';

interface Notification {
  id: string;
  type: string;
  message: string;
  status: string;
  created_at: string;
  data?: any;
}

const NotificationsPage: React.FC = () => {
  const { user, loading: userLoading, unreadNotificationsCount, refreshNotificationsCount } = useUser();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [loadingBookingDetails, setLoadingBookingDetails] = useState(false);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

  useEffect(() => {
    if (!userLoading) {
      loadNotifications();
    }
  }, [userLoading]);

  useEffect(() => {
    filterNotifications();
    setCurrentPage(1); // Reset to first page when filter changes
  }, [currentFilter, notifications]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/v1/notifications`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setNotifications(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = [...notifications];

    switch (currentFilter) {
      case 'unread':
        filtered = filtered.filter(n => n.status !== 'read');
        break;
      case 'general':
        filtered = filtered.filter(n => n.type === 'general');
        break;
      case 'booking':
        filtered = filtered.filter(n => n.type === 'booking' || n.type === 'booking_created');
        break;
      case 'payment':
        filtered = filtered.filter(n => n.type === 'payment');
        break;
    }

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (notificationId: string) => {
    setMarkingAsRead(notificationId);
    try {
      const response = await fetch(`${API_BASE_URL}/v1/notifications/mark-as-read/${notificationId}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setNotifications(notifications.map(n =>
          n.id === notificationId ? { ...n, status: 'read' } : n
        ));
        showSuccessMessage('Notification marked as read');
        // Refresh notification count in UserContext
        await refreshNotificationsCount();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setMarkingAsRead(null);
    }
  };

  const handleMarkAllRead = () => {
    if (unreadNotificationsCount === 0) {
      showSuccessMessage('No unread notifications to mark as read');
      return;
    }

    setConfirmDialog({
      show: true,
      title: 'Mark All as Read',
      message: 'Are you sure you want to mark all unread notifications as read?',
      onConfirm: markAllAsRead
    });
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAllAsRead(true);
      const response = await fetch(`${API_BASE_URL}/v1/notifications/mark-all/as-read`, {
        method: 'PATCH',
        credentials: 'include'
      });

      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, status: 'read' })));
        showSuccessMessage('All notifications marked as read');
        // Refresh notification count in UserContext
        await refreshNotificationsCount();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const handleDeleteNotification = (notificationId: string) => {
    setConfirmDialog({
      show: true,
      title: 'Delete Notification',
      message: 'Are you sure you want to delete this notification? This action cannot be undone.',
      onConfirm: () => deleteNotification(notificationId)
    });
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setNotifications(notifications.filter(n => n.id !== notificationId));
        showSuccessMessage('Notification deleted successfully');
        // Refresh notification count in UserContext
        await refreshNotificationsCount();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    setSelectedNotification(notification);

    // Mark as read if unread
    if (notification.status !== 'read') {
      await markAsRead(notification.id);
    }

    // Parse notification data to check for booking_id
    const notificationData = parseNotificationData(notification);
    if (notificationData && notificationData.booking_id) {
      // Fetch full booking details
      await fetchAndAttachBookingDetails(notification, notificationData.booking_id);
    }
  };

  const fetchAndAttachBookingDetails = async (notification: Notification, bookingId: string) => {
    try {
      setLoadingBookingDetails(true);
      console.log('Fetching booking details for booking_id:', bookingId);
      const response = await fetch(`${API_BASE_URL}/v1/bookings/${bookingId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Booking API response:', data);

        if (data.success && data.data) {
          // Attach the full booking data to the notification
          const updatedNotification = {
            ...notification,
            data: typeof notification.data === 'string'
              ? JSON.stringify({ ...JSON.parse(notification.data), booking: data.data })
              : { ...notification.data, booking: data.data }
          };
          setSelectedNotification(updatedNotification);
          console.log('Updated notification with booking data:', updatedNotification);
        }
      } else {
        console.error('Failed to fetch booking details:', response.status);
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
    } finally {
      setLoadingBookingDetails(false);
    }
  };

  const closeNotificationDetail = () => {
    setSelectedNotification(null);
    setLoadingBookingDetails(false);
  };


  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const getNotificationIcon = (type: string): string => {
    const iconMap: { [key: string]: string } = {
      general: 'fas fa-info-circle',
      booking: 'fas fa-calendar-check',
      booking_created: 'fas fa-calendar-plus',
      payment: 'fas fa-credit-card',
      reminder: 'fas fa-bell',
      alert: 'fas fa-exclamation-triangle',
      system: 'fas fa-cog'
    };
    return iconMap[type] || 'fas fa-bell';
  };

  const getNotificationIconClass = (type: string): string => {
    const classMap: { [key: string]: string } = {
      general: 'icon-info',
      booking: 'icon-booking',
      booking_created: 'icon-booking',
      payment: 'icon-payment',
      reminder: 'icon-warning',
      alert: 'icon-error',
      system: 'icon-info'
    };
    return classMap[type] || 'icon-info';
  };

  const getNotificationTitle = (type: string): string => {
    const titleMap: { [key: string]: string } = {
      general: 'General Notification',
      booking: 'Booking Update',
      booking_created: 'Booking Created',
      payment: 'Payment Notification',
      reminder: 'Reminder',
      alert: 'Alert',
      system: 'System Notification'
    };
    return titleMap[type] || 'Notification';
  };

  const getCategoryBadge = (type: string): string => {
    if (type === 'booking' || type === 'booking_created') return 'booking';
    if (type === 'payment') return 'payment';
    return 'general';
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) {
      return {
        date: 'N/A',
        time: 'N/A'
      };
    }

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return {
        date: 'Invalid Date',
        time: 'Invalid Time'
      };
    }

    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };

    return {
      date: date.toLocaleDateString('en-US', dateOptions),
      time: date.toLocaleTimeString('en-US', timeOptions)
    };
  };

  const parseNotificationData = (notification: Notification) => {
    if (!notification.data) {
      console.log('No notification data available');
      return null;
    }

    try {
      const parsed = typeof notification.data === 'string'
        ? JSON.parse(notification.data)
        : notification.data;
      console.log('Parsed notification data:', parsed);
      return parsed;
    } catch (e) {
      console.error('Error parsing notification data:', e);
      return null;
    }
  };

  const renderBookingDetails = (notificationData: any) => {
    console.log('renderBookingDetails called with:', notificationData);

    if (!notificationData) {
      console.log('No notification data provided');
      return null;
    }

    if (!notificationData.booking) {
      console.log('No booking data in notification. Available keys:', Object.keys(notificationData));
      return null;
    }

    const booking = notificationData.booking;
    console.log('Booking data:', booking);

    const startDateTime = formatDateTime(booking.start_at);
    const endDateTime = formatDateTime(booking.end_at);

    // Extract staff information
    let staffNames = new Set<string>();
    let staffEmails = new Set<string>();
    if (booking.booking_services && booking.booking_services.length > 0) {
      booking.booking_services.forEach((bs: any) => {
        if (bs.assigned_staff) {
          const fullName = `${bs.assigned_staff.first_name || ''} ${bs.assigned_staff.last_name || ''}`.trim();
          if (fullName) staffNames.add(fullName);
          if (bs.assigned_staff.email) staffEmails.add(bs.assigned_staff.email);
        }
      });
    }

    const staffName = staffNames.size > 0 ? Array.from(staffNames).join(', ') : 'N/A';
    const staffEmail = staffEmails.size > 0 ? Array.from(staffEmails).join(', ') : '';

    // Calculate total price and build services list
    let totalPrice = 0;
    const services = booking.booking_services?.map((bs: any) => {
      const service = bs.category_service;
      if (service) {
        const price = (service.price || 0) / 100;
        const discountPrice = (service.discount_price || 0) / 100;
        const finalPrice = discountPrice && discountPrice < price ? discountPrice : price;
        totalPrice += finalPrice;

        return {
          name: service.name || 'Unknown Service',
          duration: service.duration || 0,
          price: price,
          discountPrice: discountPrice,
          finalPrice: finalPrice
        };
      }
      return null;
    }).filter(Boolean) || [];

    // Customer information
    const customer = booking.customer || {};
    const customerName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'N/A';
    const customerEmail = customer.email || '';
    const customerPhone = customer.phone || '';

    return {
      date: startDateTime.date,
      startTime: startDateTime.time,
      endTime: endDateTime.time,
      staffName,
      staffEmail,
      services,
      totalPrice,
      customerName,
      customerEmail,
      customerPhone,
      notes: booking.notes || ''
    };
  };

  const totalCount = notifications.length;

  // Pagination calculations
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotifications = filteredNotifications.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  if (loading || userLoading) {
    return (
      <>
        <Sidebar user={user} unreadNotificationsCount={unreadNotificationsCount} />
        <div className="page-with-sidebar">
          <div className="notifications-page">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading notifications...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar user={user} unreadNotificationsCount={unreadNotificationsCount} />
      <div className="page-with-sidebar">
        <div className="notifications-page">
          <div className="page-header">
            <h1>Notifications</h1>
            <p>View and manage your notifications</p>
          </div>

          {successMessage && (
            <div className="success-message">
              <i className="fas fa-check-circle"></i>
              <span>{successMessage}</span>
            </div>
          )}

          {confirmDialog?.show && (
            <div className="confirmation-overlay" onClick={() => setConfirmDialog(null)}>
              <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="confirmation-header">
                  <h3>{confirmDialog.title}</h3>
                </div>
                <div className="confirmation-body">
                  <p>{confirmDialog.message}</p>
                </div>
                <div className="confirmation-actions">
                  <button
                    className="action-button secondary"
                    onClick={() => setConfirmDialog(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="action-button danger"
                    onClick={() => {
                      confirmDialog.onConfirm();
                      setConfirmDialog(null);
                    }}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="notifications-container">
            <div className="notifications-header">
              <div className="header-content">
                <div className="header-text">
                  {/*<h2>*/}
                  {/*  <span className="notifications-icon">*/}
                  {/*    <i className="fas fa-bell"></i>*/}
                  {/*  </span>*/}
                  {/*  Notifications*/}
                  {/*</h2>*/}
                  {/*<p>View and manage your notifications</p>*/}
                </div>
                <div className="header-actions">
                  <button
                    className="action-button primary"
                    onClick={handleMarkAllRead}
                    disabled={unreadNotificationsCount === 0 || markingAllAsRead}
                  >
                    {markingAllAsRead ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Marking as Read...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check-double"></i>
                        Mark All Read
                      </>
                    )}
                  </button>
                  <button
                    className="action-button secondary"
                    onClick={loadNotifications}
                  >
                    <i className="fas fa-sync-alt"></i>
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            <div className="card-body">
              {/* Stats Bar */}
              <div className="notifications-stats-bar">
                <div className="stat-item">
                  <i className="fas fa-inbox"></i>
                  <span className="stat-value">{totalCount}</span>
                  <span className="stat-label">Total</span>
                </div>
                <div className="stat-item">
                  <i className="fas fa-envelope"></i>
                    <span className="stat-value">{unreadNotificationsCount}</span>
                  <span className="stat-label">Unread</span>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="notifications-filter">
                <div className="filter-tabs">
                  <button
                    className={`filter-tab ${currentFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setCurrentFilter('all')}
                  >
                    <i className="fas fa-inbox"></i>
                    All
                  </button>
                  <button
                    className={`filter-tab ${currentFilter === 'unread' ? 'active' : ''}`}
                    onClick={() => setCurrentFilter('unread')}
                  >
                    <i className="fas fa-envelope"></i>
                    Unread
                  </button>
                  <button
                    className={`filter-tab ${currentFilter === 'general' ? 'active' : ''}`}
                    onClick={() => setCurrentFilter('general')}
                  >
                    <i className="fas fa-info-circle"></i>
                    General
                  </button>
                  <button
                    className={`filter-tab ${currentFilter === 'booking' ? 'active' : ''}`}
                    onClick={() => setCurrentFilter('booking')}
                  >
                    <i className="fas fa-calendar"></i>
                    Booking
                  </button>
                  <button
                    className={`filter-tab ${currentFilter === 'payment' ? 'active' : ''}`}
                    onClick={() => setCurrentFilter('payment')}
                  >
                    <i className="fas fa-credit-card"></i>
                    Payment
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              {filteredNotifications.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-bell-slash"></i>
                  <p>No notifications found. You're all caught up!</p>
                </div>
              ) : (
                <>
                  {/* Top Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="pagination-controls pagination-top">
                      <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                      >
                        <i className="fas fa-angle-double-left"></i>
                      </button>
                      <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="fas fa-angle-left"></i>
                      </button>

                      {/* Page numbers */}
                      <div className="page-numbers">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          // Show first, last, current, and pages around current
                          const showPage =
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1);

                          const showEllipsis =
                            (page === currentPage - 2 && currentPage > 3) ||
                            (page === currentPage + 2 && currentPage < totalPages - 2);

                          if (showEllipsis) {
                            return <span key={page} className="pagination-ellipsis">...</span>;
                          }

                          if (!showPage) {
                            return null;
                          }

                          return (
                            <button
                              key={page}
                              className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <i className="fas fa-angle-right"></i>
                      </button>
                      <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        <i className="fas fa-angle-double-right"></i>
                      </button>
                    </div>
                  )}

                  {/* Items per page selector and info */}
                  <div className="pagination-info">
                    <div className="items-per-page">
                      <label>Show:</label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                        className="items-select"
                      >
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                      <span>entries</span>
                    </div>
                    <div className="showing-info">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredNotifications.length)} of {filteredNotifications.length} notifications
                    </div>
                  </div>

                  <div className="notifications-list">
                    {currentNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`notification-item ${notification.status !== 'read' ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className={`notification-icon ${getNotificationIconClass(notification.type)}`}>
                          <i className={getNotificationIcon(notification.type)}></i>
                        </div>
                        <div className="notification-content">
                          <div className="notification-header">
                            {notification.status !== 'read' && <span className="unread-badge"></span>}
                            <span className="notification-title">
                              {getNotificationTitle(notification.type)}
                            </span>
                          </div>
                          <div className="notification-message">{notification.message}</div>
                          <div className="notification-meta">
                            <span className={`category-badge ${getCategoryBadge(notification.type)}`}>
                              {getCategoryBadge(notification.type)}
                            </span>
                            <span className="notification-time">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="notification-actions" onClick={(e) => e.stopPropagation()}>
                          {notification.status !== 'read' && (
                            <button
                              className="action-btn"
                              onClick={() => markAsRead(notification.id)}
                              title="Mark as read"
                              disabled={markingAsRead === notification.id}
                            >
                              {markingAsRead === notification.id ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                <i className="fas fa-check"></i>
                              )}
                            </button>
                          )}
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteNotification(notification.id)}
                            title="Delete notification"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="pagination-controls">
                      <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                      >
                        <i className="fas fa-angle-double-left"></i>
                      </button>
                      <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="fas fa-angle-left"></i>
                      </button>

                      {/* Page numbers */}
                      <div className="page-numbers">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          // Show first, last, current, and pages around current
                          const showPage =
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1);

                          const showEllipsis =
                            (page === currentPage - 2 && currentPage > 3) ||
                            (page === currentPage + 2 && currentPage < totalPages - 2);

                          if (showEllipsis) {
                            return <span key={page} className="pagination-ellipsis">...</span>;
                          }

                          if (!showPage) {
                            return null;
                          }

                          return (
                            <button
                              key={page}
                              className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <i className="fas fa-angle-right"></i>
                      </button>
                      <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        <i className="fas fa-angle-double-right"></i>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Notification Detail Modal */}
          {selectedNotification && (
            <div className="notification-detail-overlay" onClick={closeNotificationDetail}>
              <div className="notification-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="notification-detail-header">
                  <div className="notification-detail-title-section">
                    <div className={`notification-detail-icon ${getNotificationIconClass(selectedNotification.type)}`}>
                      <i className={getNotificationIcon(selectedNotification.type)}></i>
                    </div>
                    <div>
                      <h3>{getNotificationTitle(selectedNotification.type)}</h3>
                      <div className="notification-time-subtitle">
                        {new Date(selectedNotification.created_at).toLocaleString()}
                      </div>
                      <span className={`category-badge ${getCategoryBadge(selectedNotification.type)}`}>
                        {getCategoryBadge(selectedNotification.type)}
                      </span>
                    </div>
                  </div>
                  <button className="close-btn" onClick={closeNotificationDetail}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <div className="notification-detail-body">
                  <div className="notification-detail-message">
                    <h4>Message</h4>
                    <p>{selectedNotification.message}</p>
                  </div>

                  {(() => {
                    const notificationData = parseNotificationData(selectedNotification);
                    const bookingDetails = renderBookingDetails(notificationData);

                    // Show loading state while fetching booking details
                    if (loadingBookingDetails) {
                      return (
                        <div className="booking-details-loading">
                          <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading booking details...</p>
                          </div>
                        </div>
                      );
                    }

                    if (bookingDetails) {
                      return (
                        <div className="booking-details-section">
                          <h4 className="section-title">
                            <i className="fas fa-calendar-alt"></i> Booking Details
                          </h4>

                          {/* Two Column Layout */}
                          <div className="booking-details-grid">
                            {/* Left Column - Date & Time */}
                            <div className="detail-card">
                              <div className="detail-header">
                                <i className="fas fa-clock"></i> Date & Time
                              </div>
                              <div className="detail-content">
                                <div className="detail-row">
                                  <span className="detail-label">Date:</span>
                                  <span className="detail-value">{bookingDetails.date}</span>
                                </div>
                                <div className="detail-row">
                                  <span className="detail-label">Time:</span>
                                  <span className="detail-value">{bookingDetails.startTime} - {bookingDetails.endTime}</span>
                                </div>
                              </div>
                            </div>

                            {/* Right Column - Staff Member */}
                            <div className="detail-card">
                              <div className="detail-header">
                                <i className="fas fa-user-tie"></i> Staff Member
                              </div>
                              <div className="detail-content">
                                <div className="detail-row">
                                  <span className="detail-label">Name:</span>
                                  <span className="detail-value">{bookingDetails.staffName}</span>
                                </div>
                                {bookingDetails.staffEmail && (
                                  <div className="detail-row">
                                    <span className="detail-label">Email:</span>
                                    <span className="detail-value">{bookingDetails.staffEmail}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Left Column - Services */}
                            {bookingDetails.services.length > 0 && (
                              <div className="detail-card">
                                <div className="detail-header">
                                  <i className="fas fa-concierge-bell"></i> Services
                                </div>
                                <div className="detail-content">
                                  <ul className="services-list">
                                    {bookingDetails.services.map((service: any, index: number) => (
                                      <li key={index} className="service-item">
                                        <div className="service-info">
                                          <span className="service-name">{service.name}</span>
                                          <span className="service-duration">{service.duration}min</span>
                                        </div>
                                        <div className="service-pricing">
                                          {service.discountPrice && service.discountPrice < service.price ? (
                                            <>
                                              <span className="original-price">${service.price.toFixed(2)}</span>
                                              <span className="discount-price">${service.discountPrice.toFixed(2)}</span>
                                            </>
                                          ) : (
                                            <span className="service-price">${service.price.toFixed(2)}</span>
                                          )}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                  <div className="total-price">
                                    <span className="total-label">Total:</span>
                                    <span className="total-value">${bookingDetails.totalPrice.toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Right Column - Customer */}
                            <div className="detail-card">
                              <div className="detail-header">
                                <i className="fas fa-user"></i> Customer
                              </div>
                              <div className="detail-content">
                                <div className="detail-row">
                                  <span className="detail-label">Name:</span>
                                  <span className="detail-value">{bookingDetails.customerName}</span>
                                </div>
                                {bookingDetails.customerEmail && (
                                  <div className="detail-row">
                                    <span className="detail-label">Email:</span>
                                    <span className="detail-value">{bookingDetails.customerEmail}</span>
                                  </div>
                                )}
                                {bookingDetails.customerPhone && (
                                  <div className="detail-row">
                                    <span className="detail-label">Phone:</span>
                                    <span className="detail-value">{bookingDetails.customerPhone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Notes - Full Width */}
                          {bookingDetails.notes && (
                            <div className="detail-card detail-card-full">
                              <div className="detail-header">
                                <i className="fas fa-sticky-note"></i> Notes
                              </div>
                              <div className="detail-content">
                                <p className="notes-text">{bookingDetails.notes}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="notification-detail-footer">
                  <button
                    className="action-button danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(selectedNotification.id);
                      closeNotificationDetail();
                    }}
                  >
                    <i className="fas fa-trash"></i>
                    Delete
                  </button>
                  <button className="action-button primary" onClick={closeNotificationDetail}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationsPage;

