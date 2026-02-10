import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import '../styles/booking-confirmation.css';

// Google Maps API Key - Add your API key here or use environment variable
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

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
        <div className="confirmation-loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="confirmation-container">
        <div className="confirmation-card">
          <div className="confirmation-error-icon">⚠️</div>
          <h1>Unable to Load Confirmation</h1>
          <p>{error || 'Booking details not found'}</p>
          <div className="action-buttons">
            <a href={`/booking/${companySlug}`} className="confirmation-btn confirmation-btn-primary">
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
        {/* Hero Section */}
        <div className="confirmation-hero">
          <div className="success-icon-wrapper">
            <div className="success-icon">
              <svg viewBox="0 0 52 52">
                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark" d="M14 27l7.5 7.5L38 18" />
              </svg>
            </div>
          </div>

          <h1 className="confirmation-title">🎉 Booking Confirmed!</h1>
          <p className="confirmation-subtitle">
            Thank you for choosing us! We're excited to see you soon.
          </p>

          <div className="confirmation-id">
            Booking ID: <span>{bookingData.id}</span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="confirmation-content">
          {/* Left Column - Booking Details */}
          <div className="confirmation-card booking-details-card">
            <div className="card-header">
              <h2>📋 Booking Details</h2>
            </div>

            <div className="booking-summary">
              <div className="summary-item">
                <div className="summary-label">
                  <i className="fas fa-user"></i>
                  Customer
                </div>
                <div className="summary-value">
                  {bookingData.customer.first_name} {bookingData.customer.last_name}
                </div>
              </div>

              <div className="summary-item">
                <div className="summary-label">
                  <i className="fas fa-envelope"></i>
                  Email
                </div>
                <div className="summary-value">
                  {bookingData.customer.email}
                </div>
              </div>

              <div className="summary-item">
                <div className="summary-label">
                  <i className="fas fa-calendar"></i>
                  Date & Time
                </div>
                <div className="summary-value">
                  <div className="datetime-display">
                    <div className="date">{dateTime.date}</div>
                    <div className="time">{dateTime.time}</div>
                  </div>
                </div>
              </div>

              {professionals.length > 0 && (
                <div className="summary-item">
                  <div className="summary-label">
                    <i className="fas fa-user-tie"></i>
                    Professional{professionals.length > 1 ? 's' : ''}
                  </div>
                  <div className="summary-value">
                    {professionals.map((prof, index) => (
                      <span key={index} className="professional-tag">
                        {prof}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="services-section">
              <h3>Services Booked</h3>
              <div className="services-list">
                {bookingData.booking_services.map((service, index) => (
                  <div key={index} className="service-card">
                    <div className="service-info">
                      <div className="service-name">{service.category_service.name}</div>
                      <div className="service-meta">
                        <span className="service-duration">
                          <i className="fas fa-clock"></i>
                          {service.category_service.duration} min
                        </span>
                        {service.assigned_staff && (
                          <span className="service-staff">
                            with {service.assigned_staff.first_name} {service.assigned_staff.last_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="service-price">
                      €{formatPrice(
                        service.category_service.discount_price ||
                          service.category_service.price
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="total-section">
                <div className="total-row">
                  <span className="total-label">Total Amount</span>
                  <span className="total-value">€{formatPrice(bookingData.total_price)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Location & Map */}
          <div className="confirmation-card location-card">
            <div className="card-header">
              <h2>📍 Location</h2>
            </div>

            {company && (
              <div className="venue-info">
                <div className="venue-name">
                  <i className="fas fa-building"></i>
                  <strong>{company.name}</strong>
                </div>

                {address && (
                  <div className="venue-address">
                    {address.address && (
                      <div className="address-line">
                        <i className="fas fa-map-marker-alt"></i>
                        {address.address}
                      </div>
                    )}
                    {address.city && address.zip && (
                      <div className="address-line">
                        <i className="fas fa-city"></i>
                        {address.zip} {address.city}
                      </div>
                    )}
                    {address.country && (
                      <div className="address-line">
                        <i className="fas fa-globe"></i>
                        {address.country}
                      </div>
                    )}
                  </div>
                )}

                {company.phone && (
                  <div className="contact-info">
                    <a href={`tel:${company.phone}`} className="phone-link">
                      <i className="fas fa-phone"></i>
                      {company.phone}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Google Maps Integration */}
            {address?.address && (
              <div className="map-container">
                <div className="map-header">
                  <h4>Find us here</h4>
                </div>
                <div className="map-wrapper">
                  <iframe
                    src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(
                      `${address.address}, ${address.city}, ${address.country}`
                    )}&zoom=15&maptype=roadmap`}
                    width="100%"
                    height="250"
                    style={{ border: 0, borderRadius: '8px' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Business Location"
                  />
                </div>
                <div className="map-actions">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(
                      `${address.address}, ${address.city}, ${address.country}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="directions-btn"
                  >
                    <i className="fas fa-directions"></i>
                    Get Directions
                  </a>
                </div>
              </div>
            )}

            {/* Important Information */}
            <div className="info-section">
              <h4>
                <i className="fas fa-info-circle"></i>
                Important Notes
              </h4>
              <ul className="info-list">
                <li>
                  <i className="fas fa-clock"></i>
                  Please arrive 5-10 minutes before your appointment
                </li>
                <li>
                  <i className="fas fa-calendar-times"></i>
                  Cancel or reschedule at least 24 hours in advance
                </li>
                <li>
                  <i className="fas fa-envelope-check"></i>
                  Confirmation email sent to {bookingData.customer.email}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="confirmation-actions">
          <button
            onClick={() => window.print()}
            className="confirmation-btn confirmation-btn-secondary"
          >
            <i className="fas fa-print"></i>
            Print Details
          </button>
          <a
            href={`/booking/${companySlug}`}
            className="confirmation-btn confirmation-btn-primary"
          >
            <i className="fas fa-home"></i>
            Book Again
          </a>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;

