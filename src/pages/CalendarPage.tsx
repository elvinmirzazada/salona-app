import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { useUser } from '../contexts/UserContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import { calendarAPI, servicesAPI } from '../utils/api';
import { Booking, TimeOff, CalendarEvent, CreateBookingData } from '../types/calendar';
import { Service, Staff } from '../types/services';
import '../styles/calendar.css';

const CalendarPage: React.FC = () => {
  const { user, unreadNotificationsCount } = useUser();
  const calendarRef = useRef<FullCalendar>(null);

  // State management
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [_bookings, setBookings] = useState<Booking[]>([]);
  const [_timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventPopup, setShowEventPopup] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [_showTimeOffForm, _setShowTimeOffForm] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedServices, setSelectedServices] = useState<{ serviceId: string; staffId: string }[]>([]);
  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [bookingNotes, setBookingNotes] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('new');

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Auto-clear messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, timeOffsRes, servicesRes, staffRes, customersRes] = await Promise.all([
        calendarAPI.getBookings(),
        calendarAPI.getTimeOffs(),
        servicesAPI.getServices(),
        servicesAPI.getStaff(),
        calendarAPI.getCustomers(),
      ]);

      console.log('Bookings API Response:', bookingsRes);
      console.log('Time Offs API Response:', timeOffsRes);

      const bookingsData = bookingsRes.data || [];
      const timeOffsData = timeOffsRes.data || [];

      console.log('Bookings Data:', bookingsData);
      console.log('Time Offs Data:', timeOffsData);

      setBookings(bookingsData);
      setTimeOffs(timeOffsData);
      setCustomers(customersRes.data || []);
      setStaff(staffRes.data || []);

      // Process services from categories
      const servicesData: Service[] = [];
      if (servicesRes.data && Array.isArray(servicesRes.data)) {
        servicesRes.data.forEach((category: any) => {
          if (category.services && Array.isArray(category.services)) {
            category.services.forEach((service: any) => {
              servicesData.push({
                id: service.id,
                name: service.name,
                duration: service.duration,
                price: service.price,
                discount_price: service.discount_price,
                status: service.status,
                additional_info: service.additional_info || '',
                buffer_before: service.buffer_before || 0,
                buffer_after: service.buffer_after || 0,
                category_id: category.id,
                image_url: service.image_url,
                service_staff: service.service_staff || [],
              });
            });
          }
        });
      }
      setServices(servicesData);

      // Convert to calendar events
      const calendarEvents = convertToCalendarEvents(bookingsData, timeOffsData);
      setEvents(calendarEvents);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load calendar data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format dates with local timezone
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const convertToCalendarEvents = (bookingsData: Booking[], timeOffsData: TimeOff[]): CalendarEvent[] => {
    const events: CalendarEvent[] = [];

    console.log('Converting bookings to events, count:', bookingsData.length);

    // Convert bookings to events
    bookingsData.forEach((booking, index) => {
      console.log(`Booking ${index}:`, booking);

      // Generate title from customer name or use default
      const title = booking.customer
        ? `${booking.customer.first_name} ${booking.customer.last_name}`.trim()
        : 'Unknown Customer';

      let backgroundColor = '#f8f9fa';
      let borderColor = '#667eea';
      let textColor = '#2c3e50';

      // Status-based colors with improved design
      switch (booking.status) {
        case 'pending':
        case 'scheduled':
          // Amber/Yellow for pending - warm and attention-grabbing
          backgroundColor = 'rgba(251, 191, 36, 0.15)';
          borderColor = '#F59E0B';
          textColor = '#92400E';
          break;
        case 'confirmed':
          // Green for confirmed - positive and ready
          backgroundColor = 'rgba(34, 197, 94, 0.15)';
          borderColor = '#22C55E';
          textColor = '#166534';
          break;
        case 'completed':
          // Blue for completed - calm and professional
          backgroundColor = 'rgba(59, 130, 246, 0.15)';
          borderColor = '#3B82F6';
          textColor = '#1E40AF';
          break;
        case 'cancelled':
          // Red for cancelled - clear warning
          backgroundColor = 'rgba(239, 68, 68, 0.15)';
          borderColor = '#EF4444';
          textColor = '#991B1B';
          break;
        case 'no_show':
          // Purple for no-show - distinct and noticeable
          backgroundColor = 'rgba(168, 85, 247, 0.15)';
          borderColor = '#A855F7';
          textColor = '#6B21A8';
          break;
        default:
          // Default color
          backgroundColor = 'rgba(102, 126, 234, 0.15)';
          borderColor = '#667eea';
          textColor = '#4338ca';
          break;
      }

      // Parse UTC dates and convert to local timezone
      // Ensure the date string is treated as UTC by appending 'Z' if not present
      const utcStartString = booking.start_at.includes('Z') ? booking.start_at : booking.start_at + 'Z';
      const utcEndString = booking.end_at.includes('Z') ? booking.end_at : booking.end_at + 'Z';

      const startDate = new Date(utcStartString);
      const endDate = new Date(utcEndString);

      console.log(`Creating event: ${title}`);
      console.log(`  UTC: ${booking.start_at} -> Local: ${startDate.toLocaleString()}`);
      console.log(`  UTC: ${booking.end_at} -> Local: ${endDate.toLocaleString()}`);

      events.push({
        id: `booking-${booking.id}`,
        title: title,
        start: startDate.toISOString(), // Pass as ISO string in local time
        end: endDate.toISOString(),
        backgroundColor,
        borderColor,
        textColor,
        type: 'booking',
        originalEvent: booking,
      });
    });

    // Convert time-offs to events
    timeOffsData.forEach((timeOff) => {
      const title = timeOff.user
        ? `Time Off - ${timeOff.user.first_name} ${timeOff.user.last_name}`
        : 'Time Off';

      // Parse UTC dates and convert to local timezone
      const utcStartString = timeOff.start_at.includes('Z') ? timeOff.start_at : timeOff.start_at + 'Z';
      const utcEndString = timeOff.end_at.includes('Z') ? timeOff.end_at : timeOff.end_at + 'Z';

      const startDate = new Date(utcStartString);
      const endDate = new Date(utcEndString);

      events.push({
        id: `timeoff-${timeOff.id}`,
        title: title,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        backgroundColor: '#95a5a6',
        borderColor: '#7f8c8d',
        textColor: 'white',
        type: 'timeoff',
        originalEvent: timeOff,
      });
    });

    console.log('Total calendar events created:', events.length);
    console.log('Calendar events:', events);

    return events;
  };

  // Event click handler
  const handleEventClick = (clickInfo: EventClickArg) => {
    const eventId = clickInfo.event.id;
    const calendarEvent = events.find((e) => e.id === eventId);

    if (calendarEvent) {
      setSelectedEvent(calendarEvent);
      setShowEventPopup(true);
    }
  };

  // Date select handler (for creating new bookings)
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedSlot({
      start: selectInfo.start,
      end: selectInfo.end,
    });
    setShowBookingForm(true);
    setBookingStep(1);
    setSelectedServices([]);
  };

  // Handle booking form submission
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const bookingData: CreateBookingData = {
        start_datetime: selectedSlot!.start.toISOString(),
        end_datetime: selectedSlot!.end.toISOString(),
        services: selectedServices.map((s) => ({
          service_id: s.serviceId,
          user_id: s.staffId,
        })),
        notes: bookingNotes,
      };

      if (selectedCustomerId === 'new') {
        bookingData.customer_first_name = newCustomer.firstName;
        bookingData.customer_last_name = newCustomer.lastName;
        bookingData.customer_email = newCustomer.email;
        bookingData.customer_phone = newCustomer.phone;
      } else {
        bookingData.customer_id = selectedCustomerId;
      }

      await calendarAPI.createBooking(bookingData);
      setSuccess('Booking created successfully');
      closeBookingForm();
      loadAllData();
    } catch (err) {
      console.error('Failed to create booking:', err);
      setError('Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle booking status update
  const handleStatusUpdate = async (status: string) => {
    if (!selectedEvent || selectedEvent.type !== 'booking') return;

    setSubmitting(true);
    try {
      const booking = selectedEvent.originalEvent as Booking;
      await calendarAPI.updateBookingStatus(booking.id, status);
      setSuccess('Booking status updated successfully');
      setShowEventPopup(false);
      loadAllData();
    } catch (err) {
      console.error('Failed to update booking status:', err);
      setError('Failed to update booking status.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle booking deletion
  const handleDeleteBooking = async () => {
    if (!selectedEvent || selectedEvent.type !== 'booking') return;

    if (!confirm('Are you sure you want to delete this booking?')) return;

    setSubmitting(true);
    try {
      const booking = selectedEvent.originalEvent as Booking;
      await calendarAPI.deleteBooking(booking.id);
      setSuccess('Booking deleted successfully');
      setShowEventPopup(false);
      loadAllData();
    } catch (err) {
      console.error('Failed to delete booking:', err);
      setError('Failed to delete booking.');
    } finally {
      setSubmitting(false);
    }
  };

  // Close booking form
  const closeBookingForm = () => {
    setShowBookingForm(false);
    setBookingStep(1);
    setSelectedServices([]);
    setSelectedSlot(null);
    setNewCustomer({ firstName: '', lastName: '', email: '', phone: '' });
    setBookingNotes('');
    setSelectedCustomerId('new');
  };

  // Calculate total duration and price
  const calculateTotals = () => {
    let totalDuration = 0;
    let totalPrice = 0;

    selectedServices.forEach((selected) => {
      const service = services.find((s) => s.id === selected.serviceId);
      if (service) {
        totalDuration += service.duration;
        totalPrice += (service.discount_price || service.price) / 100; // Convert from cents to euros
      }
    });

    return { totalDuration, totalPrice };
  };

  const { totalDuration, totalPrice } = calculateTotals();

  // Toggle service selection
  const toggleService = (serviceId: string, staffId: string) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.serviceId === serviceId);
      if (exists) {
        return prev.filter((s) => s.serviceId !== serviceId);
      } else {
        return [...prev, { serviceId, staffId }];
      }
    });
  };

  return (
    <>
      <Sidebar user={user} unreadNotificationsCount={unreadNotificationsCount} />
      <div className="page-with-sidebar">
        {/* Messages */}
        {success && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#10b981',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            zIndex: 1001,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#ef4444',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            zIndex: 1001,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            {error}
          </div>
        )}

        <main className="calendar-page">
          <header className="calendar-header">
            <h2 className="page-title">Calendar</h2>
          </header>

          {/* Status Legend */}
          <div className="status-legend">
            <div className="legend-item">
              <span className="legend-color" style={{ background: 'rgba(251, 191, 36, 0.15)', borderColor: '#F59E0B' }}></span>
              <span className="legend-label">Pending/Scheduled</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: 'rgba(34, 197, 94, 0.15)', borderColor: '#22C55E' }}></span>
              <span className="legend-label">Confirmed</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: 'rgba(59, 130, 246, 0.15)', borderColor: '#3B82F6' }}></span>
              <span className="legend-label">Completed</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }}></span>
              <span className="legend-label">Cancelled</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: 'rgba(168, 85, 247, 0.15)', borderColor: '#A855F7' }}></span>
              <span className="legend-label">No Show</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#95a5a6', borderColor: '#7f8c8d' }}></span>
              <span className="legend-label">Time Off</span>
            </div>
          </div>

          {/* Calendar */}
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="calendar-container">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{
                  left: 'prev,next today datePicker',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay listWeek',
                }}
                slotMinTime="07:00:00"
                slotMaxTime="21:00:00"
                slotLabelInterval={'01:00'}
                allDaySlot={false}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                timeZone="local"
                nowIndicator={true}
                events={events}
                eventClick={handleEventClick}
                select={handleDateSelect}
                height="auto"
                businessHours={{
                    daysOfWeek: [1, 2, 3, 4, 5], // Mon–Fri
                    startTime: `07:00:00`,
                    endTime: `21:00:00`,
                }}
                firstDay={1}
                themeSystem={'Flatly'}
                views={{
                    dayGridMonth: {
                      dayHeaderFormat: { weekday: 'short' } // month view
                    },
                    timeGridWeek: {
                      dayHeaderFormat: {weekday: 'short', day: '2-digit' }
                    },
                    listWeek: {
                      titleFormat: { year: 'numeric', month: 'long', day: 'numeric' }
                    }
                }}
                customButtons={{
                    datePicker: {
                        text: 'Select Date',
                        click: function() {
                            // This will be handled by custom HTML injection
                        }
                    }
                }}
                buttonText={{
                    today: 'Today',
                    month: 'Month',
                    week: 'Week',
                    day: 'Day',
                    listWeek: 'List of bookings'
                }}
              />
            </div>
          )}
        </main>

        {/* Event Popup */}
        {showEventPopup && selectedEvent && (
          <>
            <div className="event-popup-overlay" onClick={() => setShowEventPopup(false)}></div>
            <div className="event-popup">
              <div className="event-popup-header">
                <div className="event-popup-title">
                  {selectedEvent.type === 'booking' ? 'Booking Details' : 'Time Off Details'}
                </div>
                <div className="event-popup-actions">
                  {selectedEvent.type === 'booking' && (
                    <>
                      {(selectedEvent.originalEvent as Booking).status === 'pending' && (
                        <button onClick={() => handleStatusUpdate('confirmed')} title="Confirm booking">
                          <i className="fas fa-check"></i>
                        </button>
                      )}
                      {(selectedEvent.originalEvent as Booking).status === 'confirmed' && (
                        <button onClick={() => handleStatusUpdate('completed')} title="Complete booking">
                          <i className="fas fa-check-circle"></i>
                        </button>
                      )}
                    </>
                  )}
                  <button onClick={handleDeleteBooking} title="Delete">
                    <i className="fas fa-trash-alt"></i>
                  </button>
                  <button className="event-popup-close" onClick={() => setShowEventPopup(false)}>
                    &times;
                  </button>
                </div>
              </div>
              <div className="event-popup-body">
                {selectedEvent.type === 'booking' ? (
                  <>
                    {(() => {
                      const booking = selectedEvent.originalEvent as Booking;
                      return (
                        <>
                          <div className="event-popup-time">
                            <i className="fas fa-clock"></i>
                            <span>{formatDateTime(booking.start_at)} - {formatTime(booking.end_at)}</span>
                          </div>
                          <div className="event-popup-status">
                            <i className="fas fa-tag"></i>
                            <span>{booking.status}</span>
                          </div>
                          <div className="event-popup-price">
                            <i className="fas fa-euro-sign"></i>
                            <span>{(booking.total_price / 100).toFixed(2)}</span>
                          </div>
                          {booking.customer && (
                            <div className="event-popup-customer">
                              <div className="event-popup-section-title">Customer Information</div>
                              <div className="event-popup-customer-detail">
                                <i className="fas fa-user"></i>
                                <span>{booking.customer.first_name} {booking.customer.last_name}</span>
                              </div>
                              <div className="event-popup-customer-detail">
                                <i className="fas fa-envelope"></i>
                                <span>{booking.customer.email}</span>
                              </div>
                              {booking.customer.phone && (
                                <div className="event-popup-customer-detail">
                                  <i className="fas fa-phone"></i>
                                  <span>{booking.customer.phone}</span>
                                </div>
                              )}
                            </div>
                          )}
                          {booking.booking_services && booking.booking_services.length > 0 && (
                            <div className="event-popup-services">
                              <div className="event-popup-section-title">Booked Services</div>
                              <div className="event-popup-services-list">
                                {booking.booking_services.map((bs, index) => (
                                  <div key={index} className="service-item">
                                    <div>
                                      <div className="service-name">{bs.category_service?.name}</div>
                                      {bs.assigned_staff && (
                                        <div className="service-staff">
                                          {bs.assigned_staff.first_name} {bs.assigned_staff.last_name}
                                        </div>
                                      )}
                                    </div>
                                    <div className="service-price">
                                      € {((bs.category_service?.discount_price || bs.category_service?.price || 0) / 100).toFixed(2)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {booking.notes && (
                            <div className="event-popup-notes">
                              <div className="event-popup-notes-title">Notes:</div>
                              <div className="event-popup-notes-value">{booking.notes}</div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <>
                    {(() => {
                      const timeOff = selectedEvent.originalEvent as TimeOff;
                      return (
                        <>
                          <div className="event-popup-time">
                            <i className="fas fa-clock"></i>
                            <span>{formatDateTime(timeOff.start_at)} - {formatTime(timeOff.end_at)}</span>
                          </div>
                          {timeOff.user && (
                            <div className="event-popup-customer-detail">
                              <i className="fas fa-user"></i>
                              <span>{timeOff.user.first_name} {timeOff.user.last_name}</span>
                            </div>
                          )}
                          {timeOff.reason && (
                            <div className="event-popup-notes">
                              <div className="event-popup-notes-title">Reason:</div>
                              <div className="event-popup-notes-value">{timeOff.reason}</div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Booking Form Panel */}
        {showBookingForm && (
          <div className={`booking-form-panel ${showBookingForm ? 'active' : ''}`}>
            <div className="booking-form-header">
              <h3>Add New Booking</h3>
              <button className="close-panel-btn" onClick={closeBookingForm}>
                &times;
              </button>
            </div>
            <div className="booking-form-content">
              <div className="booking-steps">
                <div className={`booking-step ${bookingStep === 1 ? 'active' : ''}`} onClick={() => setBookingStep(1)}>
                  <span className="step-number">1</span>
                  <span className="step-name">Services</span>
                </div>
                <div className={`booking-step ${bookingStep === 2 ? 'active' : ''}`} onClick={() => selectedServices.length > 0 && setBookingStep(2)}>
                  <span className="step-number">2</span>
                  <span className="step-name">Customer</span>
                </div>
              </div>

              <form onSubmit={handleCreateBooking}>
                {/* Step 1: Service Selection */}
                <div className={`booking-step-content ${bookingStep === 1 ? 'active' : ''}`}>
                  <div className="form-group">
                    <label>Select Services:</label>
                    <div className="custom-service-list">
                      {services.map((service) => (
                        <div key={service.id} className="service-option">
                          <input
                            type="checkbox"
                            checked={selectedServices.some((s) => s.serviceId === service.id)}
                            onChange={() => {
                              const defaultStaff = service.service_staff[0]?.user_id || staff[0]?.user_id || '';
                              toggleService(service.id, defaultStaff);
                            }}
                          />
                          <div className="service-info">
                            <div className="service-option-name">{service.name}</div>
                            <div className="service-option-details">
                              {service.duration} min • € {((service.discount_price || service.price) / 100).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="services-summary">
                    <h4>Selected Services</h4>
                    <div className="selected-services-list">
                      {selectedServices.length === 0 ? (
                        <div className="empty-selection-message">No services selected</div>
                      ) : (
                        selectedServices.map((selected, index) => {
                          const service = services.find((s) => s.id === selected.serviceId);
                          return (
                            <div key={index} className="selected-service-item">
                              <span>{service?.name}</span>
                              <span>€ {((service?.discount_price || service?.price || 0) / 100).toFixed(2)}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="services-summary-totals">
                      <div>
                        <span>Total Duration:</span>
                        <span>{totalDuration} min</span>
                      </div>
                      <div>
                        <span>Total Price:</span>
                        <span>{totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="form-actions">
                    <div></div>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => setBookingStep(2)}
                      disabled={selectedServices.length === 0}
                    >
                      Next
                    </button>
                  </div>
                </div>

                {/* Step 2: Customer Information */}
                <div className={`booking-step-content ${bookingStep === 2 ? 'active' : ''}`}>
                  <div className="form-group">
                    <label htmlFor="booking-customer">Customer:</label>
                    <select
                      id="booking-customer"
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      required
                    >
                      <option value="new">New Customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.first_name} {customer.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedCustomerId === 'new' && (
                    <div>
                      <div className="form-group">
                        <label>First Name:</label>
                        <input
                          type="text"
                          value={newCustomer.firstName}
                          onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Name:</label>
                        <input
                          type="text"
                          value={newCustomer.lastName}
                          onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Email:</label>
                        <input
                          type="email"
                          value={newCustomer.email}
                          onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone:</label>
                        <input
                          type="tel"
                          value={newCustomer.phone}
                          onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Notes:</label>
                    <textarea
                      rows={3}
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="secondary-button" onClick={() => setBookingStep(1)}>
                      Back
                    </button>
                    <button type="submit" className="primary-button" disabled={submitting}>
                      {submitting ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          Creating...
                        </>
                      ) : (
                        'Create Booking'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CalendarPage;

