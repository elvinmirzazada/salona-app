import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import UserProfile from '../components/UserProfile';
import { useUser } from '../contexts/UserContext';
import { API_BASE_URL } from '../config/api';
import '../styles/online-booking.css';

interface Company {
  id: string;
  name: string;
  slug?: string;
}

const OnlineBookingPage: React.FC = () => {
  const { user, loading: userLoading, unreadNotificationsCount } = useUser();
  const [loading, setLoading] = useState(true);
  const [, setCompany] = useState<Company | null>(null);
  const [bookingUrl, setBookingUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!userLoading && user) {
      if (user.company_id) {
        loadCompanyData(user.company_id);
      } else {
        setLoading(false);
      }
    } else if (!userLoading) {
      setLoading(false);
    }
  }, [user, userLoading]);

  const loadCompanyData = async (companyId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/companies/${companyId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setCompany(data.data);

          // Construct booking URL
          // Use window.location to get the current domain
          const currentDomain = window.location.origin;
          const slug = data.data.slug || '';
          const url = slug ? `${currentDomain}/book/${slug}` : '';
          setBookingUrl(url);
        }
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = bookingUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading || userLoading) {
    return (
      <>
        <Sidebar user={user} unreadNotificationsCount={unreadNotificationsCount} />
        <div className="page-with-sidebar">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
        </div>
      </>
    );
  }

  if (!user?.company_id) {
    return (
      <>
        <Sidebar user={user} unreadNotificationsCount={unreadNotificationsCount} />
        <div className="page-with-sidebar">
          <div className="online-booking-page">
            <div className="page-header">
              <div>
                <h1>Online Booking</h1>
                <p>You need to create a company first to use online booking.</p>
              </div>
              <UserProfile user={user} />
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
        <div className="online-booking-page">
          <div className="page-header">
            <div>
              <h1>Online Booking</h1>
              <p>Share your booking link with customers to let them book appointments directly</p>
            </div>
            <UserProfile user={user} />
          </div>

          <div className="booking-card">
            <h3>
              <i className="fas fa-calendar-check"></i>
              Customer Booking URL
            </h3>

            <p className="booking-description">
              Share this URL with your customers so they can book appointments directly with your business.
            </p>

            {bookingUrl ? (
              <>
                <div className="url-display">
                  <input
                    type="text"
                    className="url-input"
                    value={bookingUrl}
                    readOnly
                  />
                  <button
                    className={`copy-button ${copied ? 'copied' : ''}`}
                    onClick={handleCopyUrl}
                  >
                    <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                <div className="info-box">
                  <p><strong>How to use:</strong></p>
                  <p>• Share this link on your website, social media, or via email</p>
                  <p>• Customers can view available services and book appointments</p>
                  <p>• Bookings appear automatically in your dashboard</p>
                </div>

                <div className="qr-code-container">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(bookingUrl)}`}
                    alt="Booking QR Code"
                  />
                  <p>Customers can scan this QR code to book appointments</p>
                </div>
              </>
            ) : (
              <div className="info-box">
                <p><strong>Setup Required:</strong></p>
                <p>• Your company needs a unique booking URL (slug) to enable online booking</p>
                <p>• Please contact support or update your company settings</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default OnlineBookingPage;

