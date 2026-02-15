import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/public-booking.css';

interface Service {
  id: string;
  name: string;
  name_en?: string;
  name_ee?: string;
  name_ru?: string;
  duration: number;
  price: number;
  discount_price?: number;
  image_url?: string;
  category_id: string;
  service_staff?: Array<{
    id: string;
    service_id: string;
    user_id: string;
    user?: {
      first_name: string;
      last_name: string;
      email: string;
      phone?: string;
      languages?: string;
      position?: string;
      profile_photo_url?: string;
    };
  }>;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  services: Service[];
  parent_category_id?: string | null;
  subcategories?: Category[];
}

interface Staff {
  id: string;
  user_id: string;
  user: {
    first_name: string;
    last_name: string;
    position?: string;
    profile_photo_url?: string;
    languages?: string;
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
  date?: string; // Optional date for monthly view
}

interface DayAvailability {
  date: string;
  time_slots: Array<{
    start_time: string;
    end_time: string;
    is_available: boolean;
  }>;
}

interface BookingState {
  currentStep: number;
  selectedServices: Set<string>;
  selectedStaff: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    phoneCountryCode: string;
    birthday: string;
    notes: string;
  };
  termsAgreed: boolean;
}

const PublicBookingPage: React.FC = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [monthlyAvailability, setMonthlyAvailability] = useState<DayAvailability[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const [bookingState, setBookingState] = useState<BookingState>({
    currentStep: 1,
    selectedServices: new Set(),
    selectedStaff: null,
    selectedDate: null,
    selectedTime: null,
    customerInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      phoneCountryCode: '+372',
      birthday: '',
      notes: '',
    },
    termsAgreed: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch company data and services
  useEffect(() => {
    fetchInitialData();
  }, [companySlug]);

  // Generate calendar when month changes
  useEffect(() => {
    generateCalendar();
  }, [currentMonth]);

  // Fetch available time slots when staff is selected and moving to step 3
  useEffect(() => {
    if (bookingState.currentStep === 3 && bookingState.selectedStaff && bookingState.selectedServices.size > 0) {
      fetchAvailableTimeSlots();
    }
  }, [bookingState.currentStep, bookingState.selectedStaff, bookingState.selectedServices]);

  // Fetch available time slots when month changes (only if we're on step 3)
  useEffect(() => {
    if (bookingState.currentStep === 3 && bookingState.selectedStaff && bookingState.selectedServices.size > 0) {
      fetchAvailableTimeSlots();
    }
  }, [currentMonth]);


  const fetchInitialData = async () => {
    try {
      setLoading(true);
      let fetchedCompanyName = '';

      // Fetch company data (including logo)
      const companyRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/v1/companies/slug/${companySlug}`);

      if (companyRes.ok) {
        const companyData = await companyRes.json();
        if (companyData.success && companyData.data) {
          fetchedCompanyName = companyData.data.name || '';
          setCompanyName(fetchedCompanyName || 'Salon');
          setCompanyLogoUrl(companyData.data.logo_url || '');
        }
      }

      // Fetch services/categories - public endpoint, no auth required
      const servicesRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/v1/public/companies/${companySlug}/services`);

      if (!servicesRes.ok) throw new Error('Failed to load services');

      const servicesData = await servicesRes.json();

      if (servicesData.success) {
        // Recursively process categories and assign category_id to services
        const processCategory = (category: any): Category => {
          const processedCategory: Category = {
            id: category.id,
            name: category.name,
            description: category.description,
            services: (category.services || []).map((service: any) => ({
              ...service,
              category_id: category.id,
            })),
            parent_category_id: category.parent_category_id,
            subcategories: (category.subcategories || []).map((subcat: any) => processCategory(subcat)),
          };
          return processedCategory;
        };

        const processedCategories = (servicesData.data || []).map((cat: any) => processCategory(cat));
        setCategories(processedCategories);

        // Fallback to company name from services endpoint if not already set
        if (!fetchedCompanyName && servicesData.company_name) {
          setCompanyName(servicesData.company_name || 'Salon');
        }
      }

      // Fetch staff - public endpoint, no auth required
      const staffRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/v1/public/companies/${companySlug}/staff`);

      if (!staffRes.ok) throw new Error('Failed to load staff');

      const staffData = await staffRes.json();

      if (staffData.success) {
        setStaff(staffData.data || []);
      }

    } catch (err: any) {
      console.error('Failed to load booking data:', err);
      setError(err.message || 'Failed to load booking data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTimeSlots = async () => {
    if (!bookingState.selectedStaff) return;

    setLoadingTimeSlots(true);

    try {
      const serviceIds = Array.from(bookingState.selectedServices);

      // Calculate first day of the currently displayed month (from calendar)
      // Use local date components to avoid timezone conversion issues
      const year = currentMonth.getFullYear();
      const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
      const startDate = `${year}-${month}-01`;

      const params = new URLSearchParams({
        date_from: startDate,
        availability_type: 'monthly',
      });

      serviceIds.forEach(id => {
        params.append("service_ids", id);
      });

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/v1/public/companies/${companySlug}/users/${bookingState.selectedStaff}/availability?${params}`
      );

      if (!res.ok) throw new Error('Failed to load time slots');

      const responseData = await res.json();

      console.log('Availability API Response:', responseData);

      if (responseData.success && responseData.data) {
        const availabilityData = responseData.data;

        // Store the monthly availability data
        let dailySlots: DayAvailability[] = [];

        // Parse the new monthly structure: data.monthly.weekly_slots[].daily_slots[]
        if (availabilityData.monthly && availabilityData.monthly.weekly_slots) {
          // Flatten all daily_slots from all weeks into a single array
          availabilityData.monthly.weekly_slots.forEach((weekData: any) => {
            if (weekData.daily_slots && Array.isArray(weekData.daily_slots)) {
              dailySlots.push(...weekData.daily_slots);
            }
          });
        }
        // Fallback: check if we have weekly data with daily_slots
        else if (availabilityData.weekly && availabilityData.weekly.daily_slots) {
          dailySlots = availabilityData.weekly.daily_slots;
        }
        // Another fallback: check if we have direct monthly.daily_slots
        else if (availabilityData.monthly && availabilityData.monthly.daily_slots) {
          dailySlots = availabilityData.monthly.daily_slots;
        }

        console.log('Daily Slots:', dailySlots);
        setMonthlyAvailability(dailySlots);

        // If a date is already selected, show slots for that date
        if (bookingState.selectedDate) {
          generateTimeSlotsForDate(bookingState.selectedDate, dailySlots);
        } else {
          // No date selected yet, clear time slots
          setTimeSlots([]);
        }
      }
    } catch (err) {
      console.error('Failed to load time slots:', err);
      setTimeSlots([]);
      setMonthlyAvailability([]);
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  // Generate individual time slots from time ranges
  const generateTimeSlotsForDate = (dateStr: string, dailySlotsData: DayAvailability[]) => {
    const selectedDayData = dailySlotsData.find(day => day.date === dateStr);

    if (!selectedDayData || !selectedDayData.time_slots || selectedDayData.time_slots.length === 0) {
      setTimeSlots([]);
      return;
    }

    const slots: TimeSlot[] = [];

    // Get total duration of selected services
    const slotInterval = 15; // 15-minute intervals

    selectedDayData.time_slots.forEach(timeRange => {
      if (!timeRange.is_available) return;

      // Create UTC datetime objects (API returns times in UTC)
      const startUTC = new Date(`${dateStr}T${timeRange.start_time}`);
      const endUTC = new Date(`${dateStr}T${timeRange.end_time}`);

      // Convert to local time
      const startLocal = new Date(startUTC.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }));
      const endLocal = new Date(endUTC.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }));

      const startMinutes = startLocal.getHours() * 60 + startLocal.getMinutes();
      const endMinutes = endLocal.getHours() * 60 + endLocal.getMinutes();

      // Generate slots at intervals
      for (let minutes = startMinutes; minutes <= endMinutes; minutes += slotInterval) {
        // Check if there's enough time for the service
        if (minutes <= endMinutes) {
          const hour = Math.floor(minutes / 60);
          const min = minutes % 60;
          const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

          slots.push({
            time: timeStr,
            available: true,
          });
        }
      }
    });

    console.log('Generated time slots (local timezone):', slots);
    setTimeSlots(slots);
  };

  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: Date[] = [];

    // Add empty cells for days before month starts
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(new Date(0));
    }

    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    setCalendarDays(days);
  };

  const toggleService = (serviceId: string) => {
    const newSelected = new Set(bookingState.selectedServices);

    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }

    setBookingState(prev => ({
      ...prev,
      selectedServices: newSelected,
    }));
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Check if category has any services (directly or in subcategories)
  const categoryHasServices = (category: Category): boolean => {
    if (category.services && category.services.length > 0) return true;
    if (category.subcategories && category.subcategories.length > 0) {
      return category.subcategories.some(subcat => categoryHasServices(subcat));
    }
    return false;
  };

  // Recursively collect all services from category and its subcategories
  const getAllServicesFromCategory = (category: Category): Service[] => {
    let services: Service[] = [...category.services];
    if (category.subcategories) {
      category.subcategories.forEach(subcat => {
        services = [...services, ...getAllServicesFromCategory(subcat)];
      });
    }
    return services;
  };

  const selectStaff = (staffId: string) => {
    setBookingState(prev => ({
      ...prev,
      selectedStaff: staffId,
      selectedTime: null, // Reset time when staff changes
    }));
  };

  const selectDate = (date: Date) => {
    // Use local date components to avoid timezone conversion issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    setBookingState(prev => ({
      ...prev,
      selectedDate: dateStr,
      selectedTime: null, // Reset time when date changes
    }));

    // Generate time slots for selected date from monthly availability
    generateTimeSlotsForDate(dateStr, monthlyAvailability);
  };

  const selectTime = (time: string) => {
    setBookingState(prev => ({
      ...prev,
      selectedTime: time,
    }));
  };

  const goToStep = (step: number) => {
    setBookingState(prev => ({
      ...prev,
      currentStep: step,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canGoToNextStep = () => {
    const { currentStep, selectedServices, selectedStaff, selectedDate, selectedTime } = bookingState;

    if (currentStep === 1) return selectedServices.size > 0;
    if (currentStep === 2) return selectedStaff !== null;
    if (currentStep === 3) return selectedDate && selectedTime;
    if (currentStep === 4) return false; // Last step

    return false;
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bookingState.termsAgreed) {
      setError('Please agree to the terms and conditions');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const serviceIds = Array.from(bookingState.selectedServices);

      // Create a local datetime from selected date and time
      const [hours, minutes] = bookingState.selectedTime!.split(':').map(Number);
      const localDateTime = new Date(bookingState.selectedDate!);
      localDateTime.setHours(hours, minutes, 0, 0);

      // Convert to UTC for API
      const utcDateTime = new Date(localDateTime.toISOString());

      const bookingData = {
        start_time: utcDateTime.toISOString(),
        services: serviceIds.map(serviceId => ({
          category_service_id: serviceId,
          user_id: bookingState.selectedStaff,
          notes: '',
        })),
        customer_info: {
          first_name: bookingState.customerInfo.firstName,
          last_name: bookingState.customerInfo.lastName,
          email: bookingState.customerInfo.email,
          phone: bookingState.customerInfo.phoneCountryCode + bookingState.customerInfo.phone,
          ...(bookingState.customerInfo.birthday && { birthday: bookingState.customerInfo.birthday }),
        },
        notes: bookingState.customerInfo.notes,
      };

      console.log('Booking data (local time):', bookingState.selectedDate, bookingState.selectedTime);
      console.log('Booking data (UTC):', bookingData.start_time);

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/v1/public/companies/${companySlug}/bookings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData),
        }
      );

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create booking');
      }

      // Redirect to confirmation page with booking ID
      const bookingId = data.data?.id;
      if (bookingId) {
        navigate(`/booking/${companySlug}/confirmation?booking_id=${bookingId}`);
      } else {
        setSuccess('Booking created successfully! You will receive a confirmation email shortly.');
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }

    } catch (err: any) {
      console.error('Failed to create booking:', err);
      setError(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate total price
  const calculateTotal = () => {
    let total = 0;

    const collectServices = (cats: Category[]) => {
      cats.forEach(category => {
        category.services.forEach(service => {
          if (bookingState.selectedServices.has(service.id)) {
            const price = service.discount_price && service.discount_price > 0
              ? service.discount_price
              : service.price;
            total += price;
          }
        });

        if (category.subcategories) {
          collectServices(category.subcategories);
        }
      });
    };

    collectServices(categories);
    return total / 100; // Convert from cents to euros
  };

  const getSelectedServices = () => {
    const selected: Service[] = [];

    const collectServices = (cats: Category[]) => {
      cats.forEach(category => {
        category.services.forEach(service => {
          if (bookingState.selectedServices.has(service.id)) {
            selected.push(service);
          }
        });

        if (category.subcategories) {
          collectServices(category.subcategories);
        }
      });
    };

    collectServices(categories);
    return selected;
  };

  const getSelectedStaffInfo = () => {
    return staff.find(s => s.user_id === bookingState.selectedStaff);
  };

  const getTotalDuration = () => {
    let duration = 0;

    getSelectedServices().forEach(service => {
      duration += service.duration;
    });

    return duration;
  };

  // Check if a date has available time slots
  const hasAvailableSlots = (dateStr: string): boolean => {
    const dayData = monthlyAvailability.find(day => day.date === dateStr);
    return dayData ? dayData.time_slots.length > 0 && dayData.time_slots.some(slot => slot.is_available) : false;
  };

  // Filter services by search query (maintains hierarchy)
  const getFilteredCategories = (): Category[] => {
    if (!searchQuery.trim()) {
      // Return only categories that have services (directly or in subcategories)
      return categories.filter(cat => categoryHasServices(cat));
    }

    const query = searchQuery.toLowerCase();

    const filterCategory = (category: Category): Category | null => {
      // Filter services in this category
      const filteredServices = category.services.filter(service =>
        service.name.toLowerCase().includes(query) ||
        service.name_en?.toLowerCase().includes(query) ||
        service.name_ee?.toLowerCase().includes(query) ||
        service.name_ru?.toLowerCase().includes(query)
      );

      // Filter subcategories recursively
      const filteredSubcategories = (category.subcategories || [])
        .map(subcat => filterCategory(subcat))
        .filter((subcat): subcat is Category => subcat !== null);

      // Return category if it has matching services or matching subcategories
      if (filteredServices.length > 0 || filteredSubcategories.length > 0) {
        return {
          ...category,
          services: filteredServices,
          subcategories: filteredSubcategories,
        };
      }

      return null;
    };

    return categories
      .map(cat => filterCategory(cat))
      .filter((cat): cat is Category => cat !== null);
  };

  // Get staff assigned to selected services
  const getStaffForSelectedServices = (): Staff[] => {
    if (bookingState.selectedServices.size === 0) {
      return [];
    }

    const selectedServicesList = getSelectedServices();
    const staffIds = new Set<string>();

    // Collect all unique staff IDs from selected services
    selectedServicesList.forEach(service => {
      const serviceStaff = service.service_staff || [];
      serviceStaff.forEach(staffMember => {
        staffIds.add(staffMember.user_id);
      });
    });

    // Filter available staff to only include those assigned to selected services
    return staff.filter(member => staffIds.has(member.user_id));
  };

  // Filter staff by search query
  const getFilteredStaff = () => {
    // First, get only staff assigned to selected services
    const relevantStaff = getStaffForSelectedServices();

    if (!staffSearchQuery.trim()) return relevantStaff;

    const query = staffSearchQuery.toLowerCase();

    return relevantStaff.filter(s =>
      s.user.first_name.toLowerCase().includes(query) ||
      s.user.last_name.toLowerCase().includes(query) ||
      s.user.position?.toLowerCase().includes(query)
    );
  };

  const progressPercentage = (bookingState.currentStep - 1) * 33.33;

  // Recursive component to render category and its subcategories
  const renderCategory = (category: Category, level: number = 0): React.ReactElement => {
    const hasServices = category.services && category.services.length > 0;
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    // Don't render categories without any services in them or their subcategories
    if (!categoryHasServices(category)) {
      return <></>;
    }

    return (
      <div key={category.id} className={`service-category level-${level}`}>
        <div className="category-header-wrapper">
          <div
            className="category-name-clickable"
            onClick={() => toggleCategory(category.id)}
            style={{
              cursor: 'pointer',
              paddingLeft: `${level * 16}px`
            }}
          >
            {/* Always show expand/collapse icon for consistency */}
            <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} category-expand-icon`}></i>
            <h3 className="category-name-text">{category.name}</h3>
            {hasSubcategories ? (
              <span className="subcategory-badge">
                {category.subcategories!.filter(s => categoryHasServices(s)).length} subcategories
              </span>
            ) : hasServices ? (
              <span className="services-count-badge">
                {category.services.length} service{category.services.length !== 1 ? 's' : ''}
              </span>
            ) : null}
          </div>
        </div>

        {/* Render services if this category has them and is expanded */}
        {hasServices && isExpanded && (
          <div className="services-grid" style={{ marginLeft: `${level * 16}px` }}>
            {category.services.map(service => {
              const isSelected = bookingState.selectedServices.has(service.id);
              const price = service.discount_price && service.discount_price > 0
                ? service.discount_price
                : service.price;
              const hasDiscount = service.discount_price && service.discount_price > 0 && service.discount_price < service.price;

              return (
                <div
                  key={service.id}
                  className={`service-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleService(service.id)}
                >
                  {service.image_url ? (
                    <div className="service-image">
                      <img src={service.image_url} alt={service.name} />
                    </div>
                  ) : (
                    <div className="service-image service-image-placeholder">
                      <i className="fas fa-cut"></i>
                    </div>
                  )}

                  <div className="service-info">
                    <h4 className="service-name">{service.name}</h4>
                    <div className="service-meta">
                      <div className="service-duration">
                        <i className="fas fa-clock"></i>
                        <span>{service.duration} min</span>
                      </div>
                      <div className="service-price">
                        {hasDiscount ? (
                          <>
                            <span className="original-price">€{(service.price / 100).toFixed(2)}</span>
                            <span className="current-price">€{(price / 100).toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="current-price">€{(service.price / 100).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="service-selected-badge">
                      <i className="fas fa-check"></i>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Render subcategories if expanded */}
        {hasSubcategories && isExpanded && (
          <div className="subcategories-container">
            {category.subcategories!.map(subcat => renderCategory(subcat, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="public-booking-loading-overlay">
        <div className="public-booking-loading-spinner">
          <div className="public-booking-spinner-ring"></div>
          <div className="public-booking-spinner-ring"></div>
          <div className="public-booking-spinner-ring"></div>
        </div>
        <p className="public-booking-loading-text">Loading your booking experience...</p>
      </div>
    );
  }

  return (
    <div className="public-booking-page">
      {/* Animated Background */}
      <div className="background-animation">
        <div className="background-shape shape-1"></div>
        <div className="background-shape shape-2"></div>
        <div className="background-shape shape-3"></div>
      </div>

      {/* Progress Indicator */}
      <div className="progress-container">
        <div className="progress-inner">
          {/* Company Badge - Left Side */}
          <div className="company-badge animate-fade-in">
            <div className="company-badge-icon">
              {companyLogoUrl ? (
                <img src={companyLogoUrl} alt={companyName} className="company-logo-img" />
              ) : (
                <i className="fas fa-store"></i>
              )}
            </div>
            <div className="company-badge-content">
              <h1 className="company-badge-name">{companyName}</h1>
              <p className="company-badge-subtitle">Book your appointment</p>
            </div>
          </div>

          {/* Progress Steps - Right Side */}
          <div className="progress-wrapper">
            <div className="progress-steps">
              <div className="progress-line">
                <div className="progress-line-fill" style={{ width: `${progressPercentage}%` }}></div>
              </div>
              <div className={`progress-step ${bookingState.currentStep >= 1 ? 'active' : ''}`} onClick={() => goToStep(1)}>
                <div className="progress-step-circle">1</div>
                <div className="progress-step-label">Services</div>
              </div>
              <div className={`progress-step ${bookingState.currentStep >= 2 ? 'active' : ''}`}>
                <div className="progress-step-circle">2</div>
                <div className="progress-step-label">Professional</div>
              </div>
              <div className={`progress-step ${bookingState.currentStep >= 3 ? 'active' : ''}`}>
                <div className="progress-step-circle">3</div>
                <div className="progress-step-label">Date & Time</div>
              </div>
              <div className={`progress-step ${bookingState.currentStep >= 4 ? 'active' : ''}`}>
                <div className="progress-step-circle">4</div>
                <div className="progress-step-label">Your Details</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i>
          {success}
        </div>
      )}

      <div className="booking-container">
        {/* Main Content */}
        <div className="booking-main">

          {/* Step 1: Services */}
          {bookingState.currentStep === 1 && (
            <div className="step-container active">
              <div className="booking-section">
                <div className="section-header">
                  <div className="section-number">1</div>
                  <h2 className="section-title">Choose Services</h2>
                </div>
                <p className="section-subtitle">Select one or more services you'd like to book</p>

                {/* Search */}
                <div className="service-search-container">
                  <div className="search-input-wrapper">
                    <i className="fas fa-search search-icon"></i>
                    <input
                      type="text"
                      className="service-search-input"
                      placeholder="Search services..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                </div>

                {/* Services by Category */}
                <div className="step-content">
                  <div className="services-container">
                    {getFilteredCategories().map(category => renderCategory(category, 0))}
                  </div>

                  {getFilteredCategories().length === 0 && (
                    <div className="empty-state">
                      <div className="empty-state-icon">🔍</div>
                      <div>No services found</div>
                    </div>
                  )}
                </div>

                <div className="step-navigation">
                  <button className="booking-nav-button" disabled>
                    <i className="fas fa-arrow-left booking-nav-button-icon"></i>
                    <span>Previous</span>
                  </button>
                  <button
                    className="booking-nav-button primary"
                    onClick={() => goToStep(2)}
                    disabled={!canGoToNextStep()}
                  >
                    <span>Next: Choose Professional</span>
                    <i className="fas fa-arrow-right booking-nav-button-icon"></i>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Staff */}
          {bookingState.currentStep === 2 && (
            <div className="step-container active">
              <div className="booking-section">
                <div className="section-header">
                  <div className="section-number">2</div>
                  <h2 className="section-title">Select Professional</h2>
                </div>
                <p className="section-subtitle">Choose your preferred professional</p>

                {/* Search */}
                <div className="service-search-container">
                  <div className="search-input-wrapper">
                    <i className="fas fa-search search-icon"></i>
                    <input
                      type="text"
                      className="service-search-input"
                      placeholder="Search professionals..."
                      value={staffSearchQuery}
                      onChange={(e) => setStaffSearchQuery(e.target.value)}
                    />
                    {staffSearchQuery && (
                      <button className="search-clear-btn" onClick={() => setStaffSearchQuery('')}>
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                </div>

                <div className="step-content">
                  <div className="staff-grid">
                    {getFilteredStaff().map(member => (
                      <div
                        key={member.user_id}
                        className={`staff-card ${bookingState.selectedStaff === member.user_id ? 'selected' : ''}`}
                        onClick={() => selectStaff(member.user_id)}
                      >
                        <div className="staff-avatar">
                          {member.user.profile_photo_url ? (
                            <img src={member.user.profile_photo_url} alt={`${member.user.first_name} ${member.user.last_name}`} />
                          ) : (
                            <div className="staff-avatar-placeholder">
                              {member.user.first_name.charAt(0)}{member.user.last_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="staff-info">
                          <h4 className="staff-name">{member.user.first_name} {member.user.last_name}</h4>
                          {member.user.position && (
                            <p className="staff-position">{member.user.position}</p>
                          )}
                          {member.user.languages && (
                            <div className="staff-languages">
                              <i className="fas fa-language"></i>
                              <div className="languages-tags">
                                {member.user.languages.split(',').map((lang, index) => (
                                  <span key={index} className="language-tag">
                                    {lang.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {bookingState.selectedStaff === member.user_id && (
                          <div className="staff-selected-badge">
                            <i className="fas fa-check"></i>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {getFilteredStaff().length === 0 && (
                    <div className="empty-state">
                      <div className="empty-state-icon">👨‍💼</div>
                      <div>No professionals found</div>
                    </div>
                  )}
                </div>

                <div className="step-navigation">
                  <button className="booking-nav-button" onClick={() => goToStep(1)}>
                    <i className="fas fa-arrow-left booking-nav-button-icon"></i>
                    <span>Previous</span>
                  </button>
                  <button
                    className="booking-nav-button primary"
                    onClick={() => goToStep(3)}
                    disabled={!canGoToNextStep()}
                  >
                    <span>Next: Pick Date & Time</span>
                    <i className="fas fa-arrow-right booking-nav-button-icon"></i>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Date & Time */}
          {bookingState.currentStep === 3 && (
            <div className="step-container active">
              <div className="booking-section">
                <div className="section-header">
                  <div className="section-number">3</div>
                  <h2 className="section-title">Pick Date & Time</h2>
                </div>
                <p className="section-subtitle">Choose when you'd like your appointment</p>

                <div className="step-content">
                  {loadingTimeSlots ? (
                    <div className="datetime-container">
                      <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '60px 20px' }}>
                        <div className="loading-spinner">
                          <div className="spinner-ring"></div>
                          <div className="spinner-ring"></div>
                          <div className="spinner-ring"></div>
                        </div>
                        <p style={{ marginTop: '20px', color: '#667eea', fontSize: '16px', fontWeight: 500 }}>
                          Loading availability...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="datetime-container">
                      {/* Calendar */}
                      <div className="date-picker">
                        <div className="calendar-header">
                          <div className="calendar-month">
                            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </div>
                          <div className="calendar-nav">
                            <button
                              className="nav-btn"
                              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                            >
                              ←
                            </button>
                            <button
                              className="nav-btn"
                              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                            >
                              →
                            </button>
                          </div>
                        </div>
                        <div className="calendar-grid">
                          <div className="calendar-day-header">Sun</div>
                          <div className="calendar-day-header">Mon</div>
                          <div className="calendar-day-header">Tue</div>
                          <div className="calendar-day-header">Wed</div>
                          <div className="calendar-day-header">Thu</div>
                          <div className="calendar-day-header">Fri</div>
                          <div className="calendar-day-header">Sat</div>

                          {calendarDays.map((day, index) => {
                            const isToday = day.toDateString() === new Date().toDateString();
                            const isPast = day < new Date() && !isToday;
                            // Use local date components for comparison
                            const dayDateStr = day.getTime() !== 0
                              ? `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
                              : '';
                            const isSelected = bookingState.selectedDate === dayDateStr;
                            const isEmptyCell = day.getTime() === 0;
                            const hasSlots = dayDateStr ? hasAvailableSlots(dayDateStr) : false;
                            const isDisabled = !isEmptyCell && !isPast && !hasSlots;

                            return (
                              <div
                                key={index}
                                className={`calendar-day ${isEmptyCell ? 'empty' : ''} ${isPast || isDisabled ? 'past' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                                onClick={() => !isPast && !isEmptyCell && hasSlots && selectDate(day)}
                              >
                                {!isEmptyCell && day.getDate()}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Time Slots */}
                      <div className="time-slots-container">
                        <div className="calendar-month" style={{ marginBottom: '15px' }}>Available Times</div>
                        <div className="time-slots-grid">
                          {!bookingState.selectedDate ? (
                            <div className="empty-state">
                              <div className="empty-state-icon">🕐</div>
                              <div>Select a date to view available times</div>
                            </div>
                          ) : timeSlots.length === 0 ? (
                            <div className="empty-state">
                              <div className="empty-state-icon">📅</div>
                              <div>No available times for this date</div>
                            </div>
                          ) : (
                            timeSlots.map((slot, index) => (
                              <button
                                key={index}
                                className={`time-slot ${bookingState.selectedTime === slot.time ? 'selected' : ''} ${!slot.available ? 'disabled' : ''}`}
                                onClick={() => slot.available && selectTime(slot.time)}
                                disabled={!slot.available}
                              >
                                {slot.time}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="step-navigation">
                  <button className="booking-nav-button" onClick={() => goToStep(2)}>
                    <i className="fas fa-arrow-left booking-nav-button-icon"></i>
                    <span>Previous</span>
                  </button>
                  <button
                    className="booking-nav-button primary"
                    onClick={() => goToStep(4)}
                    disabled={!canGoToNextStep()}
                  >
                    <span>Next: Your Details</span>
                    <i className="fas fa-arrow-right booking-nav-button-icon"></i>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Customer Information */}
          {bookingState.currentStep === 4 && (
            <div className="step-container active">
              <div className="booking-section">
                <div className="section-header">
                  <div className="section-number">4</div>
                  <h2 className="section-title">Your Information</h2>
                </div>
                <p className="section-subtitle">We'll use this to confirm your booking</p>

                <div className="step-content">
                  <form className="customer-form" onSubmit={handleSubmitBooking}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="first-name">First Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        id="first-name"
                        placeholder="John"
                        value={bookingState.customerInfo.firstName}
                        onChange={(e) => setBookingState(prev => ({
                          ...prev,
                          customerInfo: { ...prev.customerInfo, firstName: e.target.value }
                        }))}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="last-name">Last Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        id="last-name"
                        placeholder="Doe"
                        value={bookingState.customerInfo.lastName}
                        onChange={(e) => setBookingState(prev => ({
                          ...prev,
                          customerInfo: { ...prev.customerInfo, lastName: e.target.value }
                        }))}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="email">Email *</label>
                      <input
                        type="email"
                        className="form-input"
                        id="email"
                        placeholder="john.doe@example.com"
                        value={bookingState.customerInfo.email}
                        onChange={(e) => setBookingState(prev => ({
                          ...prev,
                          customerInfo: { ...prev.customerInfo, email: e.target.value }
                        }))}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="phone">Phone Number *</label>
                      <div className="phone-input-row">
                        <select
                          id="phone-country-code"
                          className="country-code-select"
                          value={bookingState.customerInfo.phoneCountryCode}
                          onChange={(e) => setBookingState(prev => ({
                            ...prev,
                            customerInfo: { ...prev.customerInfo, phoneCountryCode: e.target.value }
                          }))}
                        >
                          <option value="+372">🇪🇪 +372</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+49">🇩🇪 +49</option>
                          <option value="+33">🇫🇷 +33</option>
                          <option value="+34">🇪🇸 +34</option>
                          <option value="+39">🇮🇹 +39</option>
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+90">🇹🇷 +90</option>
                          <option value="+994">🇦🇿 +994</option>
                        </select>
                        <input
                          type="tel"
                          className="form-input"
                          id="phone"
                          placeholder="1234567"
                          value={bookingState.customerInfo.phone}
                          onChange={(e) => setBookingState(prev => ({
                            ...prev,
                            customerInfo: { ...prev.customerInfo, phone: e.target.value }
                          }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="birthday">Birthday (Optional)</label>
                      <input
                        type="date"
                        className="form-input"
                        id="birthday"
                        value={bookingState.customerInfo.birthday}
                        onChange={(e) => setBookingState(prev => ({
                          ...prev,
                          customerInfo: { ...prev.customerInfo, birthday: e.target.value }
                        }))}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label" htmlFor="notes">Additional Notes (Optional)</label>
                      <textarea
                        className="form-input"
                        id="notes"
                        placeholder="Any special requests or information we should know..."
                        value={bookingState.customerInfo.notes}
                        onChange={(e) => setBookingState(prev => ({
                          ...prev,
                          customerInfo: { ...prev.customerInfo, notes: e.target.value }
                        }))}
                      ></textarea>
                    </div>

                    <div className="form-group full-width">
                      <div className="booking-terms">
                        <label className="booking-checkbox-container">
                          <input
                            type="checkbox"
                            id="terms-agreement"
                            checked={bookingState.termsAgreed}
                            onChange={(e) => setBookingState(prev => ({
                              ...prev,
                              termsAgreed: e.target.checked
                            }))}
                            required
                          />
                          <span className="booking-checkmark"></span>
                          <span className="booking-terms-text">
                            I agree to the{' '}
                            <a href="/booking-terms" target="_blank" rel="noopener noreferrer">
                              Booking Terms & Conditions
                            </a>
                            {' '}and{' '}
                            <a href="/booking-privacy" target="_blank" rel="noopener noreferrer">
                              Privacy Policy
                            </a>
                          </span>
                        </label>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="step-navigation">
                  <button className="booking-nav-button" onClick={() => goToStep(3)}>
                    <i className="fas fa-arrow-left booking-nav-button-icon"></i>
                    <span>Previous</span>
                  </button>
                  <button
                    type="submit"
                    className="booking-nav-button primary"
                    onClick={handleSubmitBooking}
                    disabled={submitting || !bookingState.termsAgreed}
                  >
                    {submitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin booking-nav-button-icon"></i>
                        <span>Creating Booking...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Booking</span>
                        <i className="fas fa-check booking-nav-button-icon"></i>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Booking Summary Sidebar */}
        <div className="booking-summary">
          <h3 className="summary-title">Booking Summary</h3>

          <div className="summary-section">
            <div className="summary-label">Services</div>
            <div>
              {getSelectedServices().length === 0 ? (
                <div className="summary-placeholder">No services selected</div>
              ) : (
                getSelectedServices().map(service => (
                  <div key={service.id} className="summary-item">
                    <span>{service.name}</span>
                    <span>€ {((service.discount_price && service.discount_price > 0 ? service.discount_price : service.price) / 100).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="summary-section">
            <div className="summary-label">Professional</div>
            <div>
              {!bookingState.selectedStaff ? (
                <div className="summary-placeholder">Not selected</div>
              ) : (
                <div className="summary-value">
                  {getSelectedStaffInfo()?.user.first_name} {getSelectedStaffInfo()?.user.last_name}
                </div>
              )}
            </div>
          </div>

          <div className="summary-section">
            <div className="summary-label">Date & Time</div>
            <div>
              {!bookingState.selectedDate || !bookingState.selectedTime ? (
                <div className="summary-placeholder">Not selected</div>
              ) : (
                <div className="summary-value">
                  {new Date(bookingState.selectedDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })} at {bookingState.selectedTime}
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    Duration: {getTotalDuration()} minutes
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="summary-total">
            <div className="summary-total-label">Total</div>
            <div className="summary-total-price">€ {calculateTotal().toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicBookingPage;

