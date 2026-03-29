import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import LanguageSwitcher from '../components/LanguageSwitcher';
import UserProfile from '../components/UserProfile';
import { useUser } from '../contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../utils/api';
import '../styles/online-booking.css';

interface Company {
  id: string;
  name: string;
  slug?: string;
}

const OnlineBookingPage: React.FC = () => {
  const { user, loading: userLoading, unreadNotificationsCount } = useUser();
  const { t } = useTranslation();
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
      const response = await apiClient.get(`/v1/companies/${companyId}`);
      const data = response.data;
      if (data.success && data.data) {
        setCompany(data.data);

        // Construct booking URL
        // Use window.location to get the current domain
        const currentDomain = window.location.origin;
        const slug = data.data.slug || '';
        const url = slug ? `${currentDomain}/booking/${slug}` : '';
        setBookingUrl(url);
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
                <h1>{t('onlineBooking.title')}</h1>
                <p>{t('onlineBooking.noCompanyMessage')}</p>
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
      <LanguageSwitcher />
      <div className="page-with-sidebar">
        <div className="online-booking-page">
          <div className="page-header">
            <div>
              <h1>{t('onlineBooking.title')}</h1>
              <p>{t('onlineBooking.subtitle')}</p>
            </div>
            <UserProfile user={user} />
          </div>

          <div className="booking-card">
            <h3>
              <i className="fas fa-calendar-check"></i>
              {t('onlineBooking.customerBookingUrl')}
            </h3>

            <p className="booking-description">
              {t('onlineBooking.shareUrlDescription')}
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
                    <span>{copied ? t('onlineBooking.copied') : t('onlineBooking.copyUrl')}</span>
                  </button>
                </div>

                <div className="info-box">
                  <p><strong>{t('onlineBooking.howToUse')}</strong></p>
                  <p>• {t('onlineBooking.shareOnWebsite')}</p>
                  <p>• {t('onlineBooking.customersViewServices')}</p>
                  <p>• {t('onlineBooking.bookingsAppear')}</p>
                </div>

                <div className="qr-code-container">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(bookingUrl)}`}
                    alt="Booking QR Code"
                  />
                  <p>{t('onlineBooking.qrCodeDescription')}</p>
                </div>
              </>
            ) : (
              <div className="info-box">
                <p><strong>{t('onlineBooking.setupRequired')}</strong></p>
                <p>• {t('onlineBooking.companyNeedsSlug')}</p>
                <p>• {t('onlineBooking.contactSupport')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default OnlineBookingPage;
