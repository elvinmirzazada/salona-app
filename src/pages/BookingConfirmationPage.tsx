import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import '../styles/booking-confirmation.css';

interface BookingService {
  category_service: {
    name: string;
    duration: number;
    price: number;
    discount_price?: number;
  };
  assigned_staff?: {
    first_name: string;
    last_name: string;
  };
}

interface Customer {
  first_name: string;
  last_name: string;
  email: string;
}

interface BookingData {
  id: string;
  start_at: string;
  end_at: string;
  total_price: number;
  customer: Customer;
  booking_services: BookingService[];
}

interface Company {
  id: string;
  name: string;
  phone?: string;
}

interface Address {
  address?: string;
  city?: string;
  zip?: string;
  country?: string;
}

const BookingConfirmationPage: React.FC = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [address, setAddress] = useState<Address | null>(null);

  useEffect(() => {
    if (bookingId) {
      loadData();
    } else {
      setError('Booking ID not found');
      setLoading(false);
    }
  }, [bookingId]);

  const loadData = async () => {
    try {
      // Load booking data
      const bookingRes = await fetch(`${API_BASE_URL}/v1/public/bookings/${bookingId}`);
      const bookingResult = await bookingRes.json();

      if (!bookingResult.success) {
        throw new Error(bookingResult.message || 'Failed to load booking data');
      }

      setBookingData(bookingResult.data);

      // Load company data
      const companyRes = await fetch(`${API_BASE_URL}/v1/companies/slug/${companySlug}`);
      const companyResult = await companyRes.json();

      if (companyResult.success && companyResult.data) {
        setCompany(companyResult.data);

        // Load company address
        if (companyResult.data.id) {
          const addressRes = await fetch(`${API_BASE_URL}/v1/companies/${companyResult.data.id}/address`);
          const addressResult = await addressRes.json();

          if (addressResult.success && addressResult.data) {
            setAddress(addressResult.data);
          }
        }
      }

      // Trigger confetti animation
      setTimeout(createConfetti, 500);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const createConfetti = () => {
    const container = document.getElementById('confetti-container');
    if (!container) return;

    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'];
    const confettiCount = 150;

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 3 + 's';
      confetti.style.animationDuration = Math.random() * 3 + 3 + 's';
      container.appendChild(confetti);

      setTimeout(() => confetti.remove(), 6000);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const formatPrice = (amountInCents: number) => {
    return (amountInCents / 100).toFixed(2);
  };

  const getProfessionals = () => {
    if (!bookingData?.booking_services) return [];

    const professionals = new Set<string>();
    bookingData.booking_services.forEach((service) => {
      if (service.assigned_staff) {
        const fullName = `${service.assigned_staff.first_name} ${service.assigned_staff.last_name}`.trim();
        if (fullName) {
          professionals.add(fullName);
        }
      }
    });

    return Array.from(professionals);
  };

  if (loading) {
    return (
      <div className="confirmation-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="confirmation-container">
        <div className="confirmation-card">
          <div className="error-icon">⚠️</div>
          <h1>Unable to Load Confirmation</h1>
          <p>{error || 'Booking details not found'}</p>
          <div className="action-buttons">
            <a href={`/booking/${companySlug}`} className="btn btn-primary">
              <span>🏠</span>
              <span>Back to Booking</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  const dateTime = formatDateTime(bookingData.start_at);
  const professionals = getProfessionals();

  return (
    <div className="confirmation-page">
      <div className="confetti-container" id="confetti-container"></div>

      <div className="confirmation-container">
        <div className="success-icon-wrapper">
          <div className="success-icon">
            <svg viewBox="0 0 52 52">
              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
              <path className="checkmark" d="M14 27l7.5 7.5L38 18" />
            </svg>
          </div>
        </div>

        <div className="confirmation-card">
          <h1 className="confirmation-title">🎉 Booking Confirmed!</h1>
          <p className="confirmation-subtitle">
            Thank you for choosing us! We're excited to see you soon.<br />
            A confirmation email has been sent to{' '}
            <strong>{bookingData.customer.email}</strong>
          </p>

          <div className="booking-details">
            <div className="detail-row">
              <div className="detail-label">
                <span className="detail-label-icon">📋</span>
                Services
              </div>
              <div className="detail-value">
                <ul className="service-list">
                  {bookingData.booking_services.map((service, index) => (
                    <li key={index} className="service-item">
                      <div className="service-name">{service.category_service.name}</div>
                      <div className="service-meta">
                        {service.category_service.duration} min • €
                        {formatPrice(
                          service.category_service.discount_price ||
                            service.category_service.price
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {professionals.length > 0 && (
              <div className="detail-row">
                <div className="detail-label">
                  <span className="detail-label-icon">👤</span>
                  Professional
                </div>
                <div className="detail-value">{professionals.join(', ')}</div>
              </div>
            )}

            <div className="detail-row">
              <div className="detail-label">
                <span className="detail-label-icon">📅</span>
                Date & Time
              </div>
              <div className="detail-value">
                <div className="datetime-display">
                  <div className="date">{dateTime.date}</div>
                  <div className="time">{dateTime.time}</div>
                </div>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-label">
                <span className="detail-label-icon">💰</span>
                Total
              </div>
              <div className="detail-value total-price">
                €{formatPrice(bookingData.total_price)}
              </div>
            </div>
          </div>

          {company && (
            <div className="venue-info">
              <div className="venue-title">
                <span className="venue-title-icon">📍</span>
                Where to find us
              </div>
              <div className="venue-address">
                <div className="venue-address-line">
                  <span className="address-icon">🏢</span>
                  <strong>{company.name}</strong>
                </div>
                {address?.address && (
                  <div className="venue-address-line">
                    <span className="address-icon">📍</span>
                    {address.address}
                  </div>
                )}
                {address?.city && address?.zip && (
                  <div className="venue-address-line">
                    <span className="address-icon">🗺️</span>
                    {address.zip} {address.city}
                  </div>
                )}
                {company.phone && (
                  <div className="venue-address-line">
                    <span className="address-icon">📞</span>
                    {company.phone}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="additional-info">
            <div className="info-title">
              <span>ℹ️</span>
              Important Information
            </div>
            <ul className="info-list">
              <li>Please arrive 5-10 minutes before your appointment</li>
              <li>
                If you need to cancel or reschedule, please contact us at least 24 hours in
                advance
              </li>
              <li>A confirmation email with all details has been sent to you</li>
              <li>Feel free to contact us if you have any questions</li>
            </ul>
          </div>

          <div className="action-buttons">
            <a href={`/booking/${companySlug}`} className="btn btn-primary">
              <span>🏠</span>
              <span>Back to Home</span>
            </a>
            <button onClick={() => window.print()} className="btn btn-secondary">
              <span>🖨️</span>
              <span>Print Confirmation</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;

