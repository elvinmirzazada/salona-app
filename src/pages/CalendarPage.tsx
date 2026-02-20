import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import { useUser } from '../contexts/UserContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import luxon3Plugin from '@fullcalendar/luxon3';
import UserProfile from '../components/UserProfile';
import listPlugin from '@fullcalendar/list';
import { EventClickArg, DateSelectArg } from '@fullcalendar/core';
import { calendarAPI, servicesAPI } from '../utils/api';
import { Booking, TimeOff, CalendarEvent, CreateBookingData } from '../types/calendar';
import { Service, Staff } from '../types/services';
import '../styles/calendar.css';
import {
  formatDateTimeInTimezone,
  formatTimeInTimezone,
  getDateInTimezone,
  getTimeInTimezone,
  createUTCFromLocalDateTime
} from '../utils/timezoneUtils';

const CalendarPage: React.FC = () => {
  const { user, unreadNotificationsCount, companyTimezone } = useUser();
  const calendarRef = useRef<FullCalendar>(null);
  const initialLoadDone = useRef(false);
  const isLoadingData = useRef(false);

  // State management
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [_bookings, setBookings] = useState<Booking[]>([]);
  const [_timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [_, setCategories] = useState<any[]>([]);
  const [flatCategories, setFlatCategories] = useState<any[]>([]); // Flattened categories for easier lookup
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
  const [slotActionPosition, setSlotActionPosition] = useState<{ x: number; y: number; openAbove?: boolean }>({ x: 0, y: 0 });
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
  const [timeOffStartDate, setTimeOffStartDate] = useState('');
  const [timeOffStartTime, setTimeOffStartTime] = useState('');
  const [timeOffEndDate, setTimeOffEndDate] = useState('');
  const [timeOffEndTime, setTimeOffEndTime] = useState('');

  // Track if selected slot is in the past
  const [isSelectedSlotPast, setIsSelectedSlotPast] = useState(false);

  // Status filter state
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // Service search state
  const [serviceSearch, setServiceSearch] = useState('');

  // Start date/time state for booking form
  const [bookingStartDate, setBookingStartDate] = useState('');
  const [bookingStartTime, setBookingStartTime] = useState('');

  // Selected master/staff for booking
  const [selectedMasterId, setSelectedMasterId] = useState('');

  // Load data on mount - removed as datesSet will be called on initial render
  // useEffect(() => {
  //   loadAllData();
  // }, []);

  // Refresh events when status filter changes (client-side filtering only)
  useEffect(() => {
    if (initialLoadDone.current && _bookings.length > 0) {
      console.log('Status filter changed, re-filtering events client-side');
      // Just re-convert events with the new filter applied
      const calendarEvents = convertToCalendarEvents(_bookings, _timeOffs);
      setEvents(calendarEvents);
    }
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

  // Reload only bookings and time-offs data and refresh calendar
  const reloadCalendarData = async () => {
    try {
      const [bookingsRes, timeOffsRes] = await Promise.all([
        calendarAPI.getBookings(),
        calendarAPI.getTimeOffs(),
      ]);

      // Check for API errors
      if (!bookingsRes.success) {
        setError(bookingsRes.message || 'Failed to load bookings.');
        return;
      }
      if (!timeOffsRes.success) {
        setError(timeOffsRes.message || 'Failed to load time-offs.');
        return;
      }

      const bookingsData = bookingsRes.data || [];
      const timeOffsData = timeOffsRes.data || [];

      setBookings(bookingsData);
      setTimeOffs(timeOffsData);

      // Convert to calendar events and update calendar
      const calendarEvents = convertToCalendarEvents(bookingsData, timeOffsData);
      setEvents(calendarEvents);

      // Refresh FullCalendar view
      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi) {
        calendarApi.removeAllEvents();
        calendarEvents.forEach(event => calendarApi.addEvent(event));
      }
    } catch (err: any) {
      console.error('Failed to reload calendar data:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to reload calendar data.');
    }
  };

  const loadAllData = async (startDate?: string, endDate?: string, loadOnlyBookings: boolean = false) => {
    // Prevent concurrent calls
    if (isLoadingData.current) {
      console.log('Already loading data, skipping duplicate call');
      return;
    }

    try {
      isLoadingData.current = true;
      setDataLoading(true);

      if (loadOnlyBookings) {
        // When navigating weeks, only reload bookings, time-offs, and customers
        const [bookingsRes, timeOffsRes, customersRes] = await Promise.all([
          calendarAPI.getBookings(startDate, endDate),
          calendarAPI.getTimeOffs(),
          calendarAPI.getCustomers(),
        ]);

        // Check for API errors
        if (!bookingsRes.success) {
          setError(bookingsRes.message || 'Failed to load bookings.');
          setDataLoading(false);
          isLoadingData.current = false;
          return;
        }
        if (!timeOffsRes.success) {
          setError(timeOffsRes.message || 'Failed to load time-offs.');
          setDataLoading(false);
          isLoadingData.current = false;
          return;
        }
        if (!customersRes.success) {
          setError(customersRes.message || 'Failed to load customers.');
          setDataLoading(false);
          isLoadingData.current = false;
          return;
        }

        const bookingsData = bookingsRes.data || [];
        const timeOffsData = timeOffsRes.data || [];

        console.log('Bookings Data:', bookingsData);
        console.log('Time Offs Data:', timeOffsData);

        setBookings(bookingsData);
        setTimeOffs(timeOffsData);
        setCustomers(customersRes.data || []);

        // Convert to calendar events
        const calendarEvents = convertToCalendarEvents(bookingsData, timeOffsData);
        setEvents(calendarEvents);
      } else {
        // Initial load - load everything
        const [bookingsRes, timeOffsRes, servicesRes, staffRes, customersRes] = await Promise.all([
          calendarAPI.getBookings(startDate, endDate),
          calendarAPI.getTimeOffs(),
          servicesAPI.getServices(),
          servicesAPI.getStaff(),
          calendarAPI.getCustomers(),
        ]);

        // Check for API errors
        if (!bookingsRes.success) {
          setError(bookingsRes.message || 'Failed to load bookings.');
          setDataLoading(false);
          isLoadingData.current = false;
          return;
        }
        if (!timeOffsRes.success) {
          setError(timeOffsRes.message || 'Failed to load time-offs.');
          setDataLoading(false);
          isLoadingData.current = false;
          return;
        }
        if (!servicesRes.success) {
          setError(servicesRes.message || 'Failed to load services.');
          setDataLoading(false);
          isLoadingData.current = false;
          return;
        }
        if (!staffRes.success) {
          setError(staffRes.message || 'Failed to load staff.');
          setDataLoading(false);
          isLoadingData.current = false;
          return;
        }
        if (!customersRes.success) {
          setError(customersRes.message || 'Failed to load customers.');
          setDataLoading(false);
          isLoadingData.current = false;
          return;
        }

        const bookingsData = bookingsRes.data || [];
        const timeOffsData = timeOffsRes.data || [];

        console.log('Bookings Data:', bookingsData);
        console.log('Time Offs Data:', timeOffsData);

        setBookings(bookingsData);
        setTimeOffs(timeOffsData);
        setCustomers(customersRes.data || []);
        setStaff(staffRes.data || []);

        // Store categories
        setCategories(servicesRes.data || []);

        // Process services from categories - recursively extract from nested structure
        const servicesData: Service[] = [];
        const flatCategoriesData: any[] = [];

        // Recursive function to extract services and flatten categories
        const extractServicesFromCategory = (category: any) => {
          // Add category to flat list
          flatCategoriesData.push({
            id: category.id,
            name: category.name,
            description: category.description,
            parent_category_id: category.parent_category_id,
          });

          // Extract services from current category
          if (category.services && Array.isArray(category.services)) {
            category.services.forEach((service: any) => {
              servicesData.push({
                id: service.id,
                name: service.name,
                duration: service.duration,
                price: service.price / 100,
                discount_price: service.discount_price / 100,
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

          // Recursively process subcategories
          if (category.subcategories && Array.isArray(category.subcategories)) {
            category.subcategories.forEach((subcategory: any) => {
              extractServicesFromCategory(subcategory);
            });
          }
        };

        if (servicesRes.data && Array.isArray(servicesRes.data)) {
          servicesRes.data.forEach((category: any) => {
            extractServicesFromCategory(category);
          });
        }

        console.log('Total services extracted:', servicesData.length);
        console.log('Total categories (flat):', flatCategoriesData.length);
        setServices(servicesData);
        setFlatCategories(flatCategoriesData);

        // Convert to calendar events
        const calendarEvents = convertToCalendarEvents(bookingsData, timeOffsData);
        setEvents(calendarEvents);
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load calendar data. Please try again.');
    } finally {
      setDataLoading(false);
      isLoadingData.current = false;
    }
  };

  // Helper function to format dates with company timezone
  const formatDateTime = (dateString: string): string => {
    return formatDateTimeInTimezone(dateString);
  };

  const formatTime = (dateString: string): string => {
    return formatTimeInTimezone(dateString);
  };

  // Handle calendar view change (prev/next week)
  const handleDatesSet = (dateInfo: any) => {
    console.log('Calendar dates changed:', dateInfo);
    console.log('View type:', dateInfo.view.type);
    console.log('Start:', dateInfo.start);
    console.log('End:', dateInfo.end);
    console.log('Initial load done:', initialLoadDone.current);

    // Get the actual visible date range based on view type
    let startDate: Date;
    let endDate: Date;

    if (dateInfo.view.type === 'timeGridWeek' || dateInfo.view.type === 'listWeek') {
      // For week view: get Monday to Sunday of the visible week
      // FullCalendar's start is already the first visible day (Monday if firstDay is set to 1)
      startDate = new Date(dateInfo.start);

      // End should be 6 days after start (Monday + 6 = Sunday)
      endDate = new Date(dateInfo.start);
      endDate.setDate(endDate.getDate() + 6);
    } else if (dateInfo.view.type === 'timeGridDay') {
      // For day view: just the single day
      startDate = new Date(dateInfo.start);
      endDate = new Date(dateInfo.start);
    } else if (dateInfo.view.type === 'dayGridMonth') {
      // For month view: get the full month range
      startDate = new Date(dateInfo.start);
      endDate = new Date(dateInfo.end);
      endDate.setDate(endDate.getDate() - 1);
    } else {
      // Default: use the provided range
      startDate = new Date(dateInfo.start);
      endDate = new Date(dateInfo.end);
      endDate.setDate(endDate.getDate() - 1);
    }

    // Format dates for API call (YYYY-MM-DD) - no UTC conversion needed
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    console.log(`Loading bookings for: ${startDateStr} to ${endDateStr}`);

    // Load data for the new date range
    const isInitialLoad = !initialLoadDone.current;
    loadAllData(startDateStr, endDateStr, !isInitialLoad);

    // Mark initial load as done
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
    }
  };

  const convertToCalendarEvents = (bookingsData: Booking[], timeOffsData: TimeOff[]): CalendarEvent[] => {
    const events: CalendarEvent[] = [];

    // Convert bookings to events
    bookingsData.forEach((booking, _) => {

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

      // API returns UTC times - pass them directly to FullCalendar
      // FullCalendar will convert them to company timezone based on timeZone prop
      console.log(booking.start_at);
      console.log(booking.end_at);
      events.push({
        id: `booking-${booking.id}`,
        title: title,
        start: booking.start_at,
        end: booking.end_at,
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

      // API returns UTC times - pass them directly to FullCalendar
      // FullCalendar will convert them to company timezone based on timeZone prop
      events.push({
        id: `timeoff-${timeOff.id}`,
        title: title,
        start: timeOff.start_date,
        end: timeOff.end_date,
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
    const clickY = jsEvent.clientY;
    const clickX = jsEvent.clientX;

    // Estimate popup height (approximate based on content)
    const popupHeight = isPast ? 200 : 150; // Larger if past date due to message
    const windowHeight = window.innerHeight;
    const spaceBelow = windowHeight - clickY;
    const spaceAbove = clickY;

    // Determine if popup should open above or below
    const shouldOpenAbove = spaceBelow < popupHeight && spaceAbove > spaceBelow;

    setSlotActionPosition({
      x: clickX,
      y: clickY,
      openAbove: shouldOpenAbove,
    });

    setShowSlotActionPopup(true);
  };

  // Handle add booking from slot action popup
  const handleAddBooking = () => {
    setShowSlotActionPopup(false);
    setShowBookingForm(true);
    setBookingStep(1);
    setSelectedServices([]);

    // Populate start date and time from selected slot using timezone utils
    if (selectedSlot) {
      const startISOString = selectedSlot.start.toISOString();
      const dateStr = getDateInTimezone(startISOString);
      const timeStr = getTimeInTimezone(startISOString);
      setBookingStartDate(dateStr);
      setBookingStartTime(timeStr);
    }
  };

  // Handle add time-off from slot action popup
  const handleAddTimeOff = () => {
    setShowSlotActionPopup(false);
    setShowTimeOffForm(true);

    // Populate start and end date/time from selected slot using timezone utils
    if (selectedSlot) {
      const startISOString = selectedSlot.start.toISOString();
      const endISOString = selectedSlot.end.toISOString();

      setTimeOffStartDate(getDateInTimezone(startISOString));
      setTimeOffStartTime(getTimeInTimezone(startISOString));
      setTimeOffEndDate(getDateInTimezone(endISOString));
      setTimeOffEndTime(getTimeInTimezone(endISOString));
    }
  };

  // Handle booking form submission
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Convert local date/time to UTC for API
      const startTimeUTC = createUTCFromLocalDateTime(bookingStartDate, bookingStartTime);

      const bookingData: CreateBookingData = {
        start_time: startTimeUTC,
        notes: bookingNotes,
        services: selectedServices.map((s) => ({
          category_service_id: s.serviceId,
          user_id: selectedMasterId, // Use selected master for all services
          notes: '', // Can add per-service notes if needed
        })),
        customer_info: {
          first_name: selectedCustomerId === 'new' ? newCustomer.firstName : customers.find(c => c.id === selectedCustomerId)?.first_name || '',
          last_name: selectedCustomerId === 'new' ? newCustomer.lastName : customers.find(c => c.id === selectedCustomerId)?.last_name || '',
          email: selectedCustomerId === 'new' ? newCustomer.email : customers.find(c => c.id === selectedCustomerId)?.email || '',
          phone: selectedCustomerId === 'new' ? newCustomer.phone : customers.find(c => c.id === selectedCustomerId)?.phone || '',
        },
      };

      console.log('Booking data being sent to API:');
      console.log('  Local time:', bookingStartDate, bookingStartTime);
      console.log('  UTC time:', startTimeUTC);

      // Add customer id if existing customer selected
      if (selectedCustomerId !== 'new') {
        bookingData.customer_info.id = selectedCustomerId;
      }

      if (isEditingBooking && editingBookingId) {
        // Update existing booking
        const response = await calendarAPI.updateBooking(editingBookingId, bookingData);

        // Check for API error
        if (!response.success) {
          setError(response.message || 'Failed to update booking.');
          setSubmitting(false);
          return;
        }

        setSuccess('Booking updated successfully');

        // Reload only bookings and time-offs data and refresh calendar
        await reloadCalendarData();
      } else {
        // Create new booking
        const response = await calendarAPI.createBooking(bookingData);

        // Check for API error
        if (!response.success) {
          setError(response.message || 'Failed to create booking.');
          setSubmitting(false);
          return;
        }

        setSuccess('Booking created successfully');

        // Add new booking event directly to calendar
        if (response.data) {
          const newBooking = response.data;
          const customerName = newBooking.customer
            ? `${newBooking.customer.first_name} ${newBooking.customer.last_name}`.trim()
            : bookingData.customer_info.first_name + ' ' + bookingData.customer_info.last_name;

          // Determine colors based on status
          let backgroundColor = 'rgba(251, 191, 36, 0.15)';
          let borderColor = '#F59E0B';
          let textColor = '#92400E';

          if (newBooking.status === 'confirmed') {
            backgroundColor = 'rgba(34, 197, 94, 0.15)';
            borderColor = '#22C55E';
            textColor = '#166534';
          }

          // Use local start from selectedSlot, but end from calculated form value
          const localStart = selectedSlot!.start.toISOString();
          // Calculate end time from start date/time + service durations
          const endDateTime = calculateEndDateTime();
          const localEnd = endDateTime ? endDateTime.toISOString() : selectedSlot!.end.toISOString();

          const newEvent: CalendarEvent = {
            id: `booking-${newBooking.id}`,
            title: customerName,
            start: localStart,
            end: localEnd,
            backgroundColor,
            borderColor,
            textColor,
            type: 'booking',
            originalEvent: newBooking,
          };

          // Add to events state
          setEvents(prevEvents => [...prevEvents, newEvent]);

          // Add to FullCalendar
          const calendarApi = calendarRef.current?.getApi();
          if (calendarApi) {
            calendarApi.addEvent(newEvent);
          }
        }
      }

      closeBookingForm();
    } catch (err: any) {
      console.error('Failed to save booking:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to save booking. Please try again.');
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

      let response;
      // Use specific endpoints for no_show and completed
      if (status === 'no_show') {
        response = await calendarAPI.markAsNoShow(booking.id);
      } else if (status === 'completed') {
        response = await calendarAPI.markAsCompleted(booking.id);
      } else {
        // Use generic status update for other statuses
        response = await calendarAPI.updateBookingStatus(booking.id, status);
      }

      // Check for API error
      if (!response.success) {
        setError(response.message || 'Failed to update booking status.');
        setSubmitting(false);
        return;
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
    } catch (err: any) {
      console.error('Failed to update booking status:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to update booking status.');
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
      const response = await calendarAPI.deleteBooking(booking.id);

      // Check for API error
      if (!response.success) {
        setError(response.message || 'Failed to delete booking.');
        setSubmitting(false);
        return;
      }

      // Remove the event from the calendar
      removeEventFromCalendar(selectedEvent.id);

      setSuccess('Booking deleted successfully');
      setShowEventPopup(false);
    } catch (err: any) {
      console.error('Failed to delete booking:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to delete booking.');
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
      const response = await calendarAPI.deleteTimeOff(timeOff.id);

      // Check for API error
      if (!response.success) {
        setError(response.message || 'Failed to delete time-off.');
        setSubmitting(false);
        return;
      }

      // Remove the event from the calendar
      removeEventFromCalendar(selectedEvent.id);

      setSuccess('Time-off deleted successfully');
      setShowEventPopup(false);
    } catch (err: any) {
      console.error('Failed to delete time-off:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to delete time-off.');
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

    // Populate start date and time using timezone utils
    const dateStr = getDateInTimezone(booking.start_at);
    const timeStr = getTimeInTimezone(booking.start_at);
    setBookingStartDate(dateStr);
    setBookingStartTime(timeStr);

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

      // Set the master from the first service's staff (assuming same master for all services)
      if (booking.booking_services[0]?.user_id) {
        setSelectedMasterId(booking.booking_services[0].user_id);
      }
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
    const startDate = new Date(timeOff.start_date);
    const endDate = new Date(timeOff.end_date);

    setSelectedSlot({
      start: startDate,
      end: endDate,
    });

    setTimeOffStartDate(getDateInTimezone(timeOff.start_date));
    setTimeOffStartTime(getTimeInTimezone(timeOff.start_date));
    setTimeOffEndDate(getDateInTimezone(timeOff.end_date));
    setTimeOffEndTime(getTimeInTimezone(timeOff.end_date));

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
    setServiceSearch('');
    setBookingStartDate('');
    setBookingStartTime('');
    setSelectedMasterId('');
  };

  // Handle time-off form submission
  const handleCreateTimeOff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Convert local date/time to UTC for API
      const startDateTimeUTC = createUTCFromLocalDateTime(timeOffStartDate, timeOffStartTime);
      const endDateTimeUTC = createUTCFromLocalDateTime(timeOffEndDate, timeOffEndTime);

      const timeOffData = {
        start_date: startDateTimeUTC,
        end_date: endDateTimeUTC,
        user_id: timeOffStaffId,
        reason: timeOffReason,
      };

      console.log('Time-off data being sent to API:');
      console.log('  Local start:', timeOffStartDate, timeOffStartTime);
      console.log('  UTC start:', startDateTimeUTC);
      console.log('  Local end:', timeOffEndDate, timeOffEndTime);
      console.log('  UTC end:', endDateTimeUTC);

      if (isEditingTimeOff && editingTimeOffId) {
        // Update existing time-off
        const response = await calendarAPI.updateTimeOff(editingTimeOffId, timeOffData);

        // Check for API error
        if (!response.success) {
          setError(response.message || 'Failed to update time-off.');
          setSubmitting(false);
          return;
        }

        setSuccess('Time-off updated successfully');

        // Reload only bookings and time-offs data and refresh calendar
        await reloadCalendarData();
      } else {
        // Create new time-off
        const response = await calendarAPI.createTimeOff(timeOffData);

        // Check for API error
        if (!response.success) {
          setError(response.message || 'Failed to schedule time-off.');
          setSubmitting(false);
          return;
        }

        setSuccess('Time off scheduled successfully');

        // Add new time-off event directly to calendar
        if (response.data) {
          const newTimeOff = response.data;
          const staffMember = staff.find(s => s.user_id === timeOffStaffId);
          const title = staffMember?.user
            ? `Time Off - ${staffMember.user.first_name} ${staffMember.user.last_name}`
            : 'Time Off';

          // Use local start from selectedSlot, but end from form end date/time fields
          const localStart = selectedSlot!.start.toISOString();
          // Use end date/time from form fields
          const endDateTime = new Date(`${timeOffEndDate}T${timeOffEndTime}`);
          const localEnd = endDateTime.toISOString();

          const newEvent: CalendarEvent = {
            id: `timeoff-${newTimeOff.id}`,
            title: title,
            start: localStart,
            end: localEnd,
            backgroundColor: '#95a5a6',
            borderColor: '#7f8c8d',
            textColor: 'white',
            type: 'timeoff',
            originalEvent: newTimeOff,
          };

          // Add to events state
          setEvents(prevEvents => [...prevEvents, newEvent]);

          // Add to FullCalendar
          const calendarApi = calendarRef.current?.getApi();
          if (calendarApi) {
            calendarApi.addEvent(newEvent);
          }
        }
      }

      closeTimeOffForm();
    } catch (err: any) {
      console.error('Failed to save time-off:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to save time-off. Please try again.');
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
    setTimeOffStartDate('');
    setTimeOffStartTime('');
    setTimeOffEndDate('');
    setTimeOffEndTime('');
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

  // Calculate end date/time based on start date/time and selected services duration
  const calculateEndDateTime = () => {
    if (!bookingStartDate || !bookingStartTime) return null;

    const startDateTime = new Date(`${bookingStartDate}T${bookingStartTime}`);
    const endDateTime = new Date(startDateTime.getTime() + totalDuration * 60000); // Add minutes

    return endDateTime;
  };

  // Handle start date/time change
  const handleStartDateTimeChange = (date: string, time: string) => {
    setBookingStartDate(date);
    setBookingStartTime(time);

    if (date && time) {
      const startDateTime = new Date(`${date}T${time}`);
      const endDateTime = new Date(startDateTime.getTime() + totalDuration * 60000);

      setSelectedSlot({
        start: startDateTime,
        end: endDateTime,
      });
    }
  };

  // Filter services by search term and group by category
  const getGroupedAndFilteredServices = () => {
    const searchLower = serviceSearch.toLowerCase();
    const filtered = services.filter(service =>
      service.name.toLowerCase().includes(searchLower) && service.status === 'active'
    );

    // Group by category
    const grouped: { [key: string]: Service[] } = {};

    filtered.forEach(service => {
      const categoryId = service.category_id || 'uncategorized';
      if (!grouped[categoryId]) {
        grouped[categoryId] = [];
      }
      grouped[categoryId].push(service);
    });

    return grouped;
  };

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
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, luxon3Plugin]}
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
              timeZone={companyTimezone}
              nowIndicator={true}
              events={events}
              eventClick={handleEventClick}
              select={handleDateSelect}
              datesSet={handleDatesSet}
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
                top: slotActionPosition.openAbove ? 'auto' : `${slotActionPosition.y}px`,
                bottom: slotActionPosition.openAbove ? `${window.innerHeight - slotActionPosition.y}px` : 'auto',
                left: `${slotActionPosition.x}px`,
                transform: slotActionPosition.openAbove ? 'translate(-50%, -10px)' : 'translate(-50%, 10px)',
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
                  {/* Date and Time Fields */}
                  <div className="form-group-row">
                    <div className="form-group">
                      <label>Start Date: *</label>
                      <input
                        type="date"
                        value={bookingStartDate}
                        onChange={(e) => handleStartDateTimeChange(e.target.value, bookingStartTime)}
                        required
                      />
                    </div>
                    <div className="form-group form-group-compact">
                      <label>Start Time: *</label>
                      <input
                        type="time"
                        value={bookingStartTime}
                        onChange={(e) => handleStartDateTimeChange(bookingStartDate, e.target.value)}
                        required
                        className="compact-time-input"
                      />
                    </div>
                  </div>

                  {/* End Date and Time (Read-only, auto-calculated) */}
                  <div className="form-group-row">
                    <div className="form-group">
                      <label>End Date:</label>
                      <input
                        type="text"
                        value={calculateEndDateTime()?.toLocaleDateString() || '—'}
                        disabled
                        style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
                      />
                    </div>
                    <div className="form-group form-group-compact">
                      <label>End Time:</label>
                      <input
                        type="text"
                        value={calculateEndDateTime()?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) || '—'}
                        disabled
                        style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
                        className="compact-time-input"
                      />
                    </div>
                  </div>

                  {/* Service Search */}
                  <div className="form-group">
                    <label>Search Services:</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Search by service name..."
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        style={{ paddingLeft: '35px' }}
                      />
                      <i className="fas fa-search" style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af'
                      }}></i>
                    </div>
                  </div>

                  {/* Services Grouped by Category */}
                  <div className="form-group">
                    <label>Select Services:</label>
                    <div className="custom-service-list">
                      {Object.entries(getGroupedAndFilteredServices()).map(([categoryId, categoryServices]) => {
                        // Find category name from flat categories data
                        const categoryName = flatCategories.find(cat => cat.id === categoryId)?.name || 'Other Services';

                        return (
                          <div key={categoryId} className="service-category-group">
                            <div className="category-header">{categoryName}</div>
                            {categoryServices.map((service) => (
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
                        );
                      })}
                      {Object.keys(getGroupedAndFilteredServices()).length === 0 && (
                        <div className="empty-selection-message">No services found</div>
                      )}
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
                        <span>€ {totalPrice.toFixed(2)}</span>
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
                    <label htmlFor="booking-customer">Customer: *</label>
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
                        <label>First Name: *</label>
                        <input
                          type="text"
                          value={newCustomer.firstName}
                          onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Name: *</label>
                        <input
                          type="text"
                          value={newCustomer.lastName}
                          onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Email: *</label>
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

                  {/* Master/Staff Selection */}
                  <div className="form-group">
                    <label htmlFor="booking-master">Master (Staff): *</label>
                    <select
                      id="booking-master"
                      value={selectedMasterId}
                      onChange={(e) => setSelectedMasterId(e.target.value)}
                      required
                    >
                      <option value="">Select a master</option>
                      {staff.map((member) => (
                        <option key={member.id} value={member.user_id}>
                          {member.user?.first_name} {member.user?.last_name} {member.user?.position ? `- ${member.user.position}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

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
                {/* Start Date and Time */}
                <div className="form-group-row">
                  <div className="form-group">
                    <label>Start Date: *</label>
                    <input
                      type="date"
                      value={timeOffStartDate}
                      onChange={(e) => setTimeOffStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group form-group-compact">
                    <label>Start Time: *</label>
                    <input
                      type="time"
                      value={timeOffStartTime}
                      onChange={(e) => setTimeOffStartTime(e.target.value)}
                      required
                      className="compact-time-input"
                    />
                  </div>
                </div>

                {/* End Date and Time */}
                <div className="form-group-row">
                  <div className="form-group">
                    <label>End Date: *</label>
                    <input
                      type="date"
                      value={timeOffEndDate}
                      onChange={(e) => setTimeOffEndDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group form-group-compact">
                    <label>End Time: *</label>
                    <input
                      type="time"
                      value={timeOffEndTime}
                      onChange={(e) => setTimeOffEndTime(e.target.value)}
                      required
                      className="compact-time-input"
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

