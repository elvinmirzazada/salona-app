import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { useUser } from '../contexts/UserContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import UserProfile from '../components/UserProfile';
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
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventPopup, setShowEventPopup] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showTimeOffForm, setShowTimeOffForm] = useState(false);
  const [showSlotActionPopup, setShowSlotActionPopup] = useState(false);
  const [slotActionPosition, setSlotActionPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [bookingStep, setBookingStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [isEditingBooking, setIsEditingBooking] = useState(false);
  const [isEditingTimeOff, setIsEditingTimeOff] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editingTimeOffId, setEditingTimeOffId] = useState<string | null>(null);

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

  // Time-off form states
  const [timeOffStaffId, setTimeOffStaffId] = useState('');
  const [timeOffReason, setTimeOffReason] = useState('');

  // Track if selected slot is in the past
  const [isSelectedSlotPast, setIsSelectedSlotPast] = useState(false);

  // Status filter state
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Refresh events when status filter changes
  useEffect(() => {
    loadAllData();
  }, [statusFilter]);

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
      setDataLoading(true);
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
      setDataLoading(false);
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

      // Apply status filter
      if (statusFilter.length > 0 && !statusFilter.includes(booking.status)) {
        return; // Skip this booking if it doesn't match the filter
      }

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
      // Apply time-off filter
      if (statusFilter.length > 0 && !statusFilter.includes('timeoff')) {
        return; // Skip time-off if not in filter
      }

      const title = timeOff.user
        ? `Time Off - ${timeOff.user.first_name} ${timeOff.user.last_name}`
        : 'Time Off';

      // Parse UTC dates and convert to local timezone
      const utcStartString = timeOff.start_date.includes('Z') ? timeOff.start_date : timeOff.start_date + 'Z';
      const utcEndString = timeOff.end_date.includes('Z') ? timeOff.end_date : timeOff.end_date + 'Z';

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
    // Prevent the slot action popup from showing
    setShowSlotActionPopup(false);

    // Prevent event propagation and default behavior
    clickInfo.jsEvent.stopPropagation();
    clickInfo.jsEvent.preventDefault();

    // Clear any calendar selection
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.unselect();
    }

    const eventId = clickInfo.event.id;
    const calendarEvent = events.find((e) => e.id === eventId);

    if (calendarEvent) {
      setSelectedEvent(calendarEvent);
      setShowEventPopup(true);
    }
  };

  // Date select handler (for creating new bookings)
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    // Check if selected date is in the past
    const now = new Date();
    const selectedDate = new Date(selectInfo.start);
    const isPast = selectedDate < now;

    setSelectedSlot({
      start: selectInfo.start,
      end: selectInfo.end,
    });

    setIsSelectedSlotPast(isPast);

    // Calculate popup position based on the click event
    const jsEvent = selectInfo.jsEvent as MouseEvent;
    setSlotActionPosition({
      x: jsEvent.clientX,
      y: jsEvent.clientY,
    });

    setShowSlotActionPopup(true);
  };

  // Handle add booking from slot action popup
  const handleAddBooking = () => {
    setShowSlotActionPopup(false);
    setShowBookingForm(true);
    setBookingStep(1);
    setSelectedServices([]);
  };

  // Handle add time-off from slot action popup
  const handleAddTimeOff = () => {
    setShowSlotActionPopup(false);
    setShowTimeOffForm(true);
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

      if (isEditingBooking && editingBookingId) {
        // Update existing booking
        await calendarAPI.updateBooking(editingBookingId, bookingData);
        setSuccess('Booking updated successfully');

        // Reload all data to get updated booking
        await loadAllData();
      } else {
        // Create new booking
        await calendarAPI.createBooking(bookingData);
        setSuccess('Booking created successfully');
        loadAllData();
      }

      closeBookingForm();
    } catch (err) {
      console.error('Failed to save booking:', err);
      setError('Failed to save booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle booking status update
  const handleStatusUpdate = async (status: string) => {
    if (!selectedEvent || selectedEvent.type !== 'booking') return;

    // Confirmation messages based on status
    let confirmMessage = '';
    if (status === 'no_show') {
      confirmMessage = 'Are you sure you want to mark this booking as No Show?';
    } else if (status === 'completed') {
      confirmMessage = 'Are you sure you want to mark this booking as Completed?';
    } else {
      confirmMessage = `Are you sure you want to change the status to ${status}?`;
    }

    if (!confirm(confirmMessage)) return;

    setSubmitting(true);
    try {
      const booking = selectedEvent.originalEvent as Booking;

      // Use specific endpoints for no_show and completed
      if (status === 'no_show') {
        await calendarAPI.markAsNoShow(booking.id);
      } else if (status === 'completed') {
        await calendarAPI.markAsCompleted(booking.id);
      } else {
        // Use generic status update for other statuses
        await calendarAPI.updateBookingStatus(booking.id, status);
      }

      // Update the booking status locally with proper typing
      const updatedBooking: Booking = {
        ...booking,
        status: status as 'pending' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
      };

      // Update the event in the calendar
      updateEventInCalendar(selectedEvent.id, updatedBooking);

      setSuccess('Booking status updated successfully');
      setShowEventPopup(false);
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

    const booking = selectedEvent.originalEvent as Booking;
    const customerName = booking.customer
      ? `${booking.customer.first_name} ${booking.customer.last_name}`
      : 'Unknown Customer';

    if (!confirm(`Are you sure you want to delete this booking for ${customerName}?\n\nThis action cannot be undone.`)) return;

    setSubmitting(true);
    try {
      await calendarAPI.deleteBooking(booking.id);

      // Remove the event from the calendar
      removeEventFromCalendar(selectedEvent.id);

      setSuccess('Booking deleted successfully');
      setShowEventPopup(false);
    } catch (err) {
      console.error('Failed to delete booking:', err);
      setError('Failed to delete booking.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle time-off deletion
  const handleDeleteTimeOff = async () => {
    if (!selectedEvent || selectedEvent.type !== 'timeoff') return;

    const timeOff = selectedEvent.originalEvent as TimeOff;
    const staffName = timeOff.user
      ? `${timeOff.user.first_name} ${timeOff.user.last_name}`
      : 'Unknown Staff';

    if (!confirm(`Are you sure you want to delete this time-off for ${staffName}?\n\nThis action cannot be undone.`)) return;

    setSubmitting(true);
    try {
      await calendarAPI.deleteTimeOff(timeOff.id);

      // Remove the event from the calendar
      removeEventFromCalendar(selectedEvent.id);

      setSuccess('Time-off deleted successfully');
      setShowEventPopup(false);
    } catch (err) {
      console.error('Failed to delete time-off:', err);
      setError('Failed to delete time-off.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit booking
  const handleEditBooking = () => {
    if (!selectedEvent || selectedEvent.type !== 'booking') return;

    const booking = selectedEvent.originalEvent as Booking;

    // Set editing mode
    setIsEditingBooking(true);
    setEditingBookingId(booking.id);

    // Pre-fill form with existing booking data
    setSelectedSlot({
      start: new Date(booking.start_at),
      end: new Date(booking.end_at),
    });

    // Pre-fill customer info
    if (booking.customer) {
      setSelectedCustomerId(booking.customer.id);
      setNewCustomer({
        firstName: booking.customer.first_name,
        lastName: booking.customer.last_name,
        email: booking.customer.email,
        phone: booking.customer.phone || '',
      });
    }

    // Pre-fill services
    if (booking.booking_services && booking.booking_services.length > 0) {
      const selectedServicesData = booking.booking_services.map((bs) => ({
        serviceId: bs.service_id,
        staffId: bs.user_id,
      }));
      setSelectedServices(selectedServicesData);
    }

    // Pre-fill notes
    setBookingNotes(booking.notes || '');

    // Close popup and open form
    setShowEventPopup(false);
    setShowBookingForm(true);
    setBookingStep(1);
  };

  // Handle edit time-off
  const handleEditTimeOff = () => {
    if (!selectedEvent || selectedEvent.type !== 'timeoff') return;

    const timeOff = selectedEvent.originalEvent as TimeOff;

    // Set editing mode
    setIsEditingTimeOff(true);
    setEditingTimeOffId(timeOff.id);

    // Pre-fill form with existing time-off data
    setSelectedSlot({
      start: new Date(timeOff.start_date),
      end: new Date(timeOff.end_date),
    });

    setTimeOffStaffId(timeOff.user_id);
    setTimeOffReason(timeOff.reason || '');

    // Close popup and open form
    setShowEventPopup(false);
    setShowTimeOffForm(true);
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
    setIsEditingBooking(false);
    setEditingBookingId(null);
  };

  // Handle time-off form submission
  const handleCreateTimeOff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const timeOffData = {
        start_datetime: selectedSlot!.start.toISOString(),
        end_datetime: selectedSlot!.end.toISOString(),
        user_id: timeOffStaffId,
        reason: timeOffReason,
      };

      if (isEditingTimeOff && editingTimeOffId) {
        // Update existing time-off
        await calendarAPI.updateTimeOff(editingTimeOffId, timeOffData);
        setSuccess('Time-off updated successfully');

        // Reload all data to get updated time-off
        await loadAllData();
      } else {
        // Create new time-off
        await calendarAPI.createTimeOff(timeOffData);
        setSuccess('Time off scheduled successfully');
        loadAllData();
      }

      closeTimeOffForm();
    } catch (err) {
      console.error('Failed to save time-off:', err);
      setError('Failed to save time-off. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Close time-off form
  const closeTimeOffForm = () => {
    setShowTimeOffForm(false);
    setSelectedSlot(null);
    setTimeOffStaffId('');
    setTimeOffReason('');
    setIsEditingTimeOff(false);
    setEditingTimeOffId(null);
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

  // Toggle status filter
  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  // Update a specific event in the calendar
  const updateEventInCalendar = (eventId: string, updatedBooking: Booking) => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return;

    // Find the event in FullCalendar
    const event = calendarApi.getEventById(eventId);
    if (!event) return;

    // Determine new colors based on status
    let backgroundColor = '#f8f9fa';
    let borderColor = '#667eea';
    let textColor = '#2c3e50';

    switch (updatedBooking.status) {
      case 'pending':
      case 'scheduled':
        backgroundColor = 'rgba(251, 191, 36, 0.15)';
        borderColor = '#F59E0B';
        textColor = '#92400E';
        break;
      case 'confirmed':
        backgroundColor = 'rgba(34, 197, 94, 0.15)';
        borderColor = '#22C55E';
        textColor = '#166534';
        break;
      case 'completed':
        backgroundColor = 'rgba(59, 130, 246, 0.15)';
        borderColor = '#3B82F6';
        textColor = '#1E40AF';
        break;
      case 'cancelled':
        backgroundColor = 'rgba(239, 68, 68, 0.15)';
        borderColor = '#EF4444';
        textColor = '#991B1B';
        break;
      case 'no_show':
        backgroundColor = 'rgba(168, 85, 247, 0.15)';
        borderColor = '#A855F7';
        textColor = '#6B21A8';
        break;
      default:
        backgroundColor = 'rgba(102, 126, 234, 0.15)';
        borderColor = '#667eea';
        textColor = '#4338ca';
        break;
    }

    // Update the event's visual properties
    event.setProp('backgroundColor', backgroundColor);
    event.setProp('borderColor', borderColor);
    event.setProp('textColor', textColor);

    // Update the events state
    setEvents((prevEvents) =>
      prevEvents.map((e) =>
        e.id === eventId
          ? {
              ...e,
              backgroundColor,
              borderColor,
              textColor,
              originalEvent: updatedBooking,
            }
          : e
      )
    );
  };

  // Remove a specific event from the calendar
  const removeEventFromCalendar = (eventId: string) => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return;

    // Find and remove the event from FullCalendar
    const event = calendarApi.getEventById(eventId);
    if (event) {
      event.remove();
    }

    // Update the events state
    setEvents((prevEvents) => prevEvents.filter((e) => e.id !== eventId));
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
            <UserProfile user={user} />
          </header>

          {/* Status Legend */}
          <div className="status-legend">
            <div
              className={`legend-item ${statusFilter.includes('confirmed') ? 'selected' : ''}`}
              onClick={() => toggleStatusFilter('confirmed')}
              style={{ cursor: 'pointer' }}
            >
              <span className="legend-color" style={{ background: 'rgba(34, 197, 94, 0.15)', borderColor: '#22C55E' }}></span>
              <span className="legend-label">Confirmed</span>
            </div>
            <div
              className={`legend-item ${statusFilter.includes('completed') ? 'selected' : ''}`}
              onClick={() => toggleStatusFilter('completed')}
              style={{ cursor: 'pointer' }}
            >
              <span className="legend-color" style={{ background: 'rgba(59, 130, 246, 0.15)', borderColor: '#3B82F6' }}></span>
              <span className="legend-label">Completed</span>
            </div>
            <div
              className={`legend-item ${statusFilter.includes('cancelled') ? 'selected' : ''}`}
              onClick={() => toggleStatusFilter('cancelled')}
              style={{ cursor: 'pointer' }}
            >
              <span className="legend-color" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }}></span>
              <span className="legend-label">Cancelled</span>
            </div>
            <div
              className={`legend-item ${statusFilter.includes('no_show') ? 'selected' : ''}`}
              onClick={() => toggleStatusFilter('no_show')}
              style={{ cursor: 'pointer' }}
            >
              <span className="legend-color" style={{ background: 'rgba(168, 85, 247, 0.15)', borderColor: '#A855F7' }}></span>
              <span className="legend-label">No Show</span>
            </div>
            <div
              className={`legend-item ${statusFilter.includes('timeoff') ? 'selected' : ''}`}
              onClick={() => toggleStatusFilter('timeoff')}
              style={{ cursor: 'pointer' }}
            >
              <span className="legend-color" style={{ background: '#95a5a6', borderColor: '#7f8c8d' }}></span>
              <span className="legend-label">Time Off</span>
            </div>
          </div>

          {/* Calendar */}
          <div className="calendar-container" style={{ position: 'relative' }}>
            {dataLoading && (
              <div className="calendar-loading-overlay">
                <div className="spinner"></div>
                <p>Loading calendar data...</p>
              </div>
            )}
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today datePicker',
                center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
                }}
                slotMinTime="07:00:00"
                slotMaxTime="21:00:00"
                slotLabelInterval={'01:00'}
                allDaySlot={false}
                editable={true}
                selectable={true}
                selectMirror={true}
                unselectAuto={true}
                unselectCancel=".fc-event,.event-popup,.booking-form-panel,.slot-action-popup"
                eventAllow={() => true}
                eventStartEditable={false}
                eventDurationEditable={false}
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
        </main>

        {/* Slot Action Popup */}
        {showSlotActionPopup && (
          <>
            <div className="event-popup-overlay" onClick={() => setShowSlotActionPopup(false)}></div>
            <div
              className="slot-action-popup"
              style={{
                position: 'fixed',
                top: `${slotActionPosition.y}px`,
                left: `${slotActionPosition.x}px`,
                transform: 'translate(-50%, 10px)',
              }}
            >
              <div className="slot-action-popup-title">
                <span>
                  {selectedSlot && new Date(selectedSlot.start).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {isSelectedSlotPast && (
                    <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.8 }}>
                      (Past Date)
                    </span>
                  )}
                </span>
              </div>
              <div className="slot-action-buttons">
                <button
                  className={`slot-action-button ${isSelectedSlotPast ? 'disabled' : ''}`}
                  onClick={handleAddBooking}
                  disabled={isSelectedSlotPast}
                  title={isSelectedSlotPast ? 'Cannot create bookings for past dates' : 'Add Booking'}
                >
                  <i className="fas fa-calendar-plus"></i>
                  <span>Add Booking</span>
                </button>
                <button
                  className={`slot-action-button ${isSelectedSlotPast ? 'disabled' : ''}`}
                  onClick={handleAddTimeOff}
                  disabled={isSelectedSlotPast}
                  title={isSelectedSlotPast ? 'Cannot schedule time-off for past dates' : 'Add Time Off'}
                >
                  <i className="fas fa-coffee"></i>
                  <span>Add Time Off</span>
                </button>
              </div>
              {isSelectedSlotPast && (
                <div className="slot-action-message">
                  <i className="fas fa-info-circle"></i>
                  <span>Cannot create bookings or time-off for past dates</span>
                </div>
              )}
            </div>
          </>
        )}

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
                      {(() => {
                        const booking = selectedEvent.originalEvent as Booking;
                        const isAdmin = user?.role === 'admin' || user?.role === 'owner';
                        const isPastEvent = new Date(booking.end_at) < new Date();

                        return (
                          <>
                            {!isPastEvent && (
                              <button
                                onClick={handleEditBooking}
                                title="Edit Booking"
                                disabled={submitting}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                            )}
                            {booking.status === 'confirmed' && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate('no_show')}
                                  title="Mark as No Show"
                                  disabled={submitting}
                                >
                                  {submitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-user-times"></i>}
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate('completed')}
                                  title="Mark as Completed"
                                  disabled={submitting}
                                >
                                  {submitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check-circle"></i>}
                                </button>
                                {isAdmin && (
                                  <button
                                    onClick={handleDeleteBooking}
                                    title="Delete"
                                    disabled={submitting}
                                  >
                                    {submitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-alt"></i>}
                                  </button>
                                )}
                              </>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}
                  {selectedEvent.type === 'timeoff' && (
                    <>
                      {(() => {
                        const timeOff = selectedEvent.originalEvent as TimeOff;
                        const isPastEvent = new Date(timeOff.end_date) < new Date();

                        return (
                          <>
                            {!isPastEvent && (
                              <button
                                onClick={handleEditTimeOff}
                                title="Edit Time Off"
                                disabled={submitting}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                            )}
                            <button
                              onClick={handleDeleteTimeOff}
                              title="Delete Time Off"
                              disabled={submitting}
                            >
                              {submitting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash-alt"></i>}
                            </button>
                          </>
                        );
                      })()}
                    </>
                  )}
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
                            <span>{formatDateTime(timeOff.start_date)} - {formatTime(timeOff.end_date)}</span>
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
              <h3>{isEditingBooking ? 'Edit Booking' : 'Add New Booking'}</h3>
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

        {/* Time Off Form Panel */}
        {showTimeOffForm && (
          <div className={`booking-form-panel ${showTimeOffForm ? 'active' : ''}`}>
            <div className="booking-form-header">
              <h3>{isEditingTimeOff ? 'Edit Time Off' : 'Schedule Time Off'}</h3>
              <button className="close-panel-btn" onClick={closeTimeOffForm}>
                &times;
              </button>
            </div>
            <div className="booking-form-content">
              <form onSubmit={handleCreateTimeOff}>
                <div className="form-group time-inputs">
                  <div>
                    <label>Start Date & Time:</label>
                    <input
                      type="text"
                      value={selectedSlot ? new Date(selectedSlot.start).toLocaleString() : ''}
                      disabled
                      style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div>
                    <label>End Date & Time:</label>
                    <input
                      type="text"
                      value={selectedSlot ? new Date(selectedSlot.end).toLocaleString() : ''}
                      disabled
                      style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="time-off-staff">Staff Member: *</label>
                  <select
                    id="time-off-staff"
                    value={timeOffStaffId}
                    onChange={(e) => setTimeOffStaffId(e.target.value)}
                    required
                  >
                    <option value="">Select staff member</option>
                    {staff.map((member) => (
                      <option key={member.id} value={member.user_id}>
                        {member.user?.first_name} {member.user?.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="time-off-reason">Reason:</label>
                  <textarea
                    id="time-off-reason"
                    rows={3}
                    value={timeOffReason}
                    onChange={(e) => setTimeOffReason(e.target.value)}
                    placeholder="Provide a reason for the time off (optional)"
                  ></textarea>
                </div>

                <div className="form-actions">
                  <button type="button" className="secondary-button" onClick={closeTimeOffForm}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-button" disabled={submitting}>
                    {submitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Scheduling...
                      </>
                    ) : (
                      'Schedule Time Off'
                    )}
                  </button>
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

