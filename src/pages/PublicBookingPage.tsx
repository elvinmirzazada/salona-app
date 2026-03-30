import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicLanguageSwitcher from '../components/PublicLanguageSwitcher';
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
  additional_info_ee?: string;
  additional_info_en?: string;
  additional_info_ru?: string;
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
}

const PublicBookingPage: React.FC = () => {
  const { companySlug } = useParams<{ companySlug: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

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
  // Set of category IDs that are collapsed (start with all collapsed by default)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gdprAccepted, setGdprAccepted] = useState(false);
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  // Fetch company data and services
  useEffect(() => {
    fetchInitialData();
  }, [companySlug]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  // Collapse all categories when they are first loaded, unless there's only a single category
  useEffect(() => {
    if (categories.length > 0 && collapsedCategories.size === 0) {
      const allCategoryIds = new Set<string>();
      const collectCategoryIds = (cats: Category[]) => {
        cats.forEach(cat => {
          allCategoryIds.add(cat.id);
          if (cat.subcategories) {
            collectCategoryIds(cat.subcategories);
          }
        });
      };
      collectCategoryIds(categories);

      // If there's only a single top-level category, expand it by default (don't add to collapsed set)
      if (categories.length === 1) {
        // Don't add the single category to collapsed set, so it will be expanded
        setCollapsedCategories(new Set());
      } else {
        setCollapsedCategories(allCategoryIds);
      }
    }
  }, [categories]);

  // Auto-select specialist if only one is available
  useEffect(() => {
    if (bookingState.currentStep === 2 && !bookingState.selectedStaff && bookingState.selectedServices.size > 0) {
      const availableStaff = getStaffForSelectedServices();
      if (availableStaff.length === 1) {
        selectStaff(availableStaff[0].user_id);
        // Optionally advance to next step automatically
        setTimeout(() => {
          goToStep(3);
        }, 500);
      }
    }
  }, [bookingState.currentStep, bookingState.selectedServices]);


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

  // Handle selecting a service from the search dropdown
  const selectServiceFromDropdown = (serviceId: string) => {
    // Find the service and its category path — ensure those categories are expanded
    const ensureExpanded = (cats: Category[]): boolean => {
      for (const cat of cats) {
        if (cat.services.some(s => s.id === serviceId)) {
          setCollapsedCategories(prev => {
            const next = new Set(prev);
            next.delete(cat.id);
            return next;
          });
          return true;
        }
        if (cat.subcategories && ensureExpanded(cat.subcategories)) {
          setCollapsedCategories(prev => {
            const next = new Set(prev);
            next.delete(cat.id);
            return next;
          });
          return true;
        }
      }
      return false;
    };
    ensureExpanded(categories);
    toggleService(serviceId);
    setShowSearchDropdown(false);
    setSearchQuery('');
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

    if (!gdprAccepted) {
      setError(t('booking.errors.termsRequired'));
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

  // Get flattened list of filtered services for dropdown display
  const getFilteredServicesForDropdown = (): Array<{ service: Service; categoryPath: string }> => {
    if (!searchQuery.trim()) {
      return [];
    }

    const results: Array<{ service: Service; categoryPath: string }> = [];
    const query = searchQuery.toLowerCase();

    const extractServices = (category: Category, parentPath: string = '') => {
      const currentPath = parentPath ? `${parentPath} > ${category.name}` : category.name;

      // Add matching services from this category
      category.services.forEach(service => {
        const matchesSearch =
          service.name.toLowerCase().includes(query) ||
          service.name_en?.toLowerCase().includes(query) ||
          service.name_ee?.toLowerCase().includes(query) ||
          service.name_ru?.toLowerCase().includes(query);

        if (matchesSearch) {
          results.push({ service, categoryPath: currentPath });
        }
      });

      // Recursively extract from subcategories
      if (category.subcategories) {
        category.subcategories.forEach(subcat => extractServices(subcat, currentPath));
      }
    };

    categories.forEach(cat => extractServices(cat));
    return results;
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

  // Helper function to get localized service name
  const getServiceName = (service: Service): string => {
    const lang = i18n.language;
    if (lang === 'en' && service.name_en) return service.name_en;
    if (lang === 'ee' && service.name_ee) return service.name_ee;
    if (lang === 'ru' && service.name_ru) return service.name_ru;
    return service.name; // fallback to default name
  };

  // Helper function to get localized additional info
  const getServiceAdditionalInfo = (service: Service): string | null => {
    const lang = i18n.language;
    if (lang === 'en' && service.additional_info_en) return service.additional_info_en;
    if (lang === 'ee' && service.additional_info_ee) return service.additional_info_ee;
    if (lang === 'ru' && service.additional_info_ru) return service.additional_info_ru;
    // Fallback: return any available additional info
    return service.additional_info_en || service.additional_info_ee || service.additional_info_ru || null;
  };

  // Helper function to get the correct locale string for date formatting
  const getLocaleString = (): string => {
    const lang = i18n.language;
    if (lang === 'et' || lang === 'ee') return 'et-EE';
    if (lang === 'ru') return 'ru-RU';
    return 'en-US'; // default to English
  };

  // Toggle collapse state for a category
  const toggleCategoryCollapse = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // ...existing code...

  if (loading) {
    return (
      <div className="public-booking-loading-overlay">
        <PublicLanguageSwitcher />
        <div className="public-booking-loading-spinner">
          <div className="public-booking-spinner-ring"></div>
          <div className="public-booking-spinner-ring"></div>
          <div className="public-booking-spinner-ring"></div>
        </div>
        <p className="public-booking-loading-text">{t('booking.loading')}</p>
      </div>
    );
  }

  return (
    <div className="public-booking-page">
      {/* Language Switcher */}
      <PublicLanguageSwitcher />

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
              <p className="company-badge-subtitle">{t('booking.title')}</p>
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
                <div className="progress-step-label">{t('booking.steps.services')}</div>
              </div>
              <div className={`progress-step ${bookingState.currentStep >= 2 ? 'active' : ''}`}>
                <div className="progress-step-circle">2</div>
                <div className="progress-step-label">{t('booking.steps.professional')}</div>
              </div>
              <div className={`progress-step ${bookingState.currentStep >= 3 ? 'active' : ''}`}>
                <div className="progress-step-circle">3</div>
                <div className="progress-step-label">{t('booking.steps.dateTime')}</div>
              </div>
              <div className={`progress-step ${bookingState.currentStep >= 4 ? 'active' : ''}`}>
                <div className="progress-step-circle">4</div>
                <div className="progress-step-label">{t('booking.steps.yourDetails')}</div>
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
                  <h2 className="section-title">{t('booking.step1.title')}</h2>
                </div>
                <p className="section-subtitle">{t('booking.step1.subtitle')}</p>

                {/* Search */}
                <div className="service-search-container" ref={searchContainerRef}>
                  <div className="search-input-wrapper">
                    <i className="fas fa-search search-icon"></i>
                    <input
                      type="text"
                      className="service-search-input"
                      placeholder={t('booking.step1.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSearchDropdown(e.target.value.trim().length > 0);
                      }}
                      onFocus={() => {
                        if (searchQuery.trim().length > 0) {
                          setShowSearchDropdown(true);
                        }
                      }}
                    />
                    {searchQuery && (
                      <button className="search-clear-btn" onClick={() => {
                        setSearchQuery('');
                        setShowSearchDropdown(false);
                      }}>
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  {showSearchDropdown && searchQuery.trim().length > 0 && (
                    <div className="search-dropdown">
                      {getFilteredServicesForDropdown().length > 0 ? (
                        <div className="search-dropdown-results">
                          {getFilteredServicesForDropdown().map(({ service, categoryPath }) => {
                            const isSelected = bookingState.selectedServices.has(service.id);
                            const price = service.discount_price && service.discount_price > 0
                              ? service.discount_price
                              : service.price;
                            const hasDiscount = service.discount_price && service.discount_price > 0 && service.discount_price < service.price;

                            return (
                              <div
                                key={service.id}
                                className={`search-dropdown-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => selectServiceFromDropdown(service.id)}
                              >
                                <div className="search-dropdown-item-content">
                                  {service.image_url ? (
                                    <div className="search-dropdown-item-image">
                                      <img src={service.image_url} alt={service.name} />
                                    </div>
                                  ) : (
                                    <div className="search-dropdown-item-image search-dropdown-item-image-placeholder">
                                      <i className="fas fa-cut"></i>
                                    </div>
                                  )}
                                  <div className="search-dropdown-item-info">
                                    <div className="search-dropdown-item-name">{getServiceName(service)}</div>
                                    <div className="search-dropdown-item-category">{categoryPath}</div>
                                    <div className="search-dropdown-item-meta">
                                      <span className="search-dropdown-item-duration">
                                        <i className="fas fa-clock"></i> {service.duration} {t('booking.step1.min')}
                                      </span>
                                      <span className="search-dropdown-item-price">
                                        {hasDiscount ? (
                                          <>
                                            <span className="original-price">€{(service.price / 100).toFixed(2)}</span>
                                            <span className="current-price">€{(price / 100).toFixed(2)}</span>
                                          </>
                                        ) : (
                                          <span>€{(service.price / 100).toFixed(2)}</span>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <div className="search-dropdown-item-check">
                                      <i className="fas fa-check"></i>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="search-dropdown-empty">
                          <i className="fas fa-search"></i>
                          <span>{t('booking.step1.noServices')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Split Panel Layout */}
                <div className="step-content">
                  <div className="services-split-panel">
                    {/* Left Panel: Category List */}
                    <div className="categories-panel">
                      {getFilteredCategories().map(category => (
                        <div
                          key={category.id}
                          className={`category-row ${collapsedCategories.has(category.id) ? '' : 'active'}`}
                          onClick={() => toggleCategoryCollapse(category.id)}
                        >
                          <span className="category-row-name">{category.name}</span>
                          <span className="category-badge">{getAllServicesFromCategory(category).length}</span>
                        </div>
                      ))}
                    </div>

                    {/* Right Panel: Service List */}
                    <div className="services-panel">
                      {getFilteredCategories().length === 0 ? (
                        <div className="empty-state" style={{ padding: '40px 20px' }}>
                          <div className="empty-state-icon">🔍</div>
                          <div>{t('booking.step1.noServices')}</div>
                        </div>
                      ) : getFilteredCategories().every(cat => collapsedCategories.has(cat.id)) ? (
                        <div className="empty-state" style={{ padding: '40px 20px' }}>
                          <div className="empty-state-icon">👈</div>
                          <div>{t('booking.step1.selectCategory')}</div>
                        </div>
                      ) : (
                        <div className="services-list">
                          {getFilteredCategories().map(category => (
                            !collapsedCategories.has(category.id) && (
                              <div key={category.id} className="services-in-category">
                                {getAllServicesFromCategory(category).map(service => {
                                  const isSelected = bookingState.selectedServices.has(service.id);
                                  const price = service.discount_price && service.discount_price > 0 ? service.discount_price : service.price;
                                  return (
                                    <div
                                      key={service.id}
                                      className={`service-list-row ${isSelected ? 'selected' : ''}`}
                                      onClick={() => toggleService(service.id)}
                                    >
                                      <div className="service-list-left">
                                        <div className="service-list-name">{getServiceName(service)}</div>
                                        <div className="service-list-description">{getServiceAdditionalInfo(service)}</div>
                                      </div>
                                      <div className="service-list-right">
                                        <div className="service-list-price">€ {(price / 100).toFixed(2)}</div>
                                        <div className="service-list-duration">{service.duration} min</div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="step-navigation">
                  <button className="booking-nav-button" disabled>
                    <i className="fas fa-arrow-left booking-nav-button-icon"></i>
                    <span>{t('booking.navigation.previous')}</span>
                  </button>
                  <button
                    className="booking-nav-button primary"
                    onClick={() => goToStep(2)}
                    disabled={!canGoToNextStep()}
                  >
                    <span>{t('booking.navigation.next')}: {t('booking.steps.professional')}</span>
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
                  <h2 className="section-title">{t('booking.step2.title')}</h2>
                </div>
                <p className="section-subtitle">{t('booking.step2.subtitle')}</p>

                {/* Search */}
                <div className="service-search-container">
                  <div className="search-input-wrapper">
                    <i className="fas fa-search search-icon"></i>
                    <input
                      type="text"
                      className="service-search-input"
                      placeholder={t('booking.step2.searchPlaceholder')}
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
                        <div className="staff-card-header">
                          <div className="staff-avatar">
                            {member.user.profile_photo_url ? (
                              <img src={member.user.profile_photo_url} alt={`${member.user.first_name} ${member.user.last_name}`} />
                            ) : (
                              <div className="staff-avatar-initials">
                                {member.user.first_name.charAt(0)}{member.user.last_name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="staff-header-info">
                            <h4 className="staff-name">{member.user.first_name} {member.user.last_name}</h4>
                            {member.user.position && (
                              <p className="staff-position">{member.user.position}</p>
                            )}
                          </div>
                        </div>

                        {/* Specialty Tags */}
                        {member.user.position && (
                          <div className="staff-specialties">
                            <span className="specialty-tag">{member.user.position}</span>
                          </div>
                        )}

                        {/* Languages */}
                        {member.user.languages && (
                          <div className="staff-languages-row">
                            {member.user.languages.split(',').map((lang, index, arr) => (
                              <span key={index} className="language-text">
                                {lang.trim()}
                                {index < arr.length - 1 && <span className="lang-separator">•</span>}
                              </span>
                            ))}
                          </div>
                        )}

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
                      <div>{t('booking.step2.noProfessionals')}</div>
                    </div>
                  )}
                </div>

                <div className="step-navigation">
                  <button className="booking-nav-button" onClick={() => goToStep(1)}>
                    <i className="fas fa-arrow-left booking-nav-button-icon"></i>
                    <span>{t('booking.navigation.previous')}</span>
                  </button>
                  <button
                    className="booking-nav-button primary"
                    onClick={() => goToStep(3)}
                    disabled={!canGoToNextStep()}
                  >
                    <span>{t('booking.navigation.nextPickDateTime')}</span>
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
                  <h2 className="section-title">{t('booking.step3.title')}</h2>
                </div>
                <p className="section-subtitle">{t('booking.step3.subtitle')}</p>

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
                          {t('booking.step3.loadingAvailability')}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="datetime-container">
                      {/* Calendar */}
                      <div className="date-picker">
                        <div className="calendar-header">
                          <div className="calendar-month">
                            {currentMonth.toLocaleDateString(getLocaleString(), { month: 'long', year: 'numeric' })}
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
                          <div className="calendar-day-header">{t('booking.step3.days.sun')}</div>
                          <div className="calendar-day-header">{t('booking.step3.days.mon')}</div>
                          <div className="calendar-day-header">{t('booking.step3.days.tue')}</div>
                          <div className="calendar-day-header">{t('booking.step3.days.wed')}</div>
                          <div className="calendar-day-header">{t('booking.step3.days.thu')}</div>
                          <div className="calendar-day-header">{t('booking.step3.days.fri')}</div>
                          <div className="calendar-day-header">{t('booking.step3.days.sat')}</div>

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
                                className={`calendar-day ${isEmptyCell ? 'empty' : ''} ${isPast ? 'past' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${isDisabled ? 'disabled' : ''}`}
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
                        <div className="time-slots-label">{t('booking.step3.selectTime')}</div>
                        <div className="time-slots-content">
                          {!bookingState.selectedDate ? (
                            <div className="empty-state">
                              <div className="empty-state-icon">🕐</div>
                              <div>{t('booking.step3.selectDate')}</div>
                            </div>
                          ) : timeSlots.length === 0 ? (
                            <div className="empty-state">
                              <div className="empty-state-icon">📅</div>
                              <div>{t('booking.step3.noSlotsAvailable')}</div>
                            </div>
                          ) : (
                            <>
                              {/* Group slots by time of day */}
                              {timeSlots.filter(slot => {
                                 const hour = parseInt(slot.time.split(':')[0]);
                                 return hour < 12;
                               }).length > 0 && (
                                 <div className="time-section">
                                   <div className="time-section-label">{t('booking.step3.morning')}</div>
                                   <div className="time-slots-group">
                                     {timeSlots.filter(slot => {
                                       const hour = parseInt(slot.time.split(':')[0]);
                                       return hour < 12;
                                     }).map((slot, index) => (
                                       <button
                                         key={index}
                                         className={`time-slot ${bookingState.selectedTime === slot.time ? 'selected' : ''} ${!slot.available ? 'disabled' : ''}`}
                                         onClick={() => slot.available && selectTime(slot.time)}
                                         disabled={!slot.available}
                                       >
                                         {slot.time}
                                       </button>
                                     ))}
                                   </div>
                                 </div>
                               )}

                               {/* Afternoon slots */}
                               {timeSlots.filter(slot => {
                                 const hour = parseInt(slot.time.split(':')[0]);
                                 return hour >= 12 && hour < 17;
                               }).length > 0 && (
                                 <div className="time-section">
                                   <div className="time-section-label">{t('booking.step3.afternoon')}</div>
                                   <div className="time-slots-group">
                                     {timeSlots.filter(slot => {
                                       const hour = parseInt(slot.time.split(':')[0]);
                                       return hour >= 12 && hour < 17;
                                     }).map((slot, index) => (
                                       <button
                                         key={index}
                                         className={`time-slot ${bookingState.selectedTime === slot.time ? 'selected' : ''} ${!slot.available ? 'disabled' : ''}`}
                                         onClick={() => slot.available && selectTime(slot.time)}
                                         disabled={!slot.available}
                                       >
                                         {slot.time}
                                       </button>
                                     ))}
                                   </div>
                                 </div>
                               )}

                               {/* Evening slots */}
                               {timeSlots.filter(slot => {
                                 const hour = parseInt(slot.time.split(':')[0]);
                                 return hour >= 17;
                               }).length > 0 && (
                                 <div className="time-section">
                                   <div className="time-section-label">{t('booking.step3.evening')}</div>
                                   <div className="time-slots-group">
                                     {timeSlots.filter(slot => {
                                       const hour = parseInt(slot.time.split(':')[0]);
                                       return hour >= 17;
                                     }).map((slot, index) => (
                                       <button
                                         key={index}
                                         className={`time-slot ${bookingState.selectedTime === slot.time ? 'selected' : ''} ${!slot.available ? 'disabled' : ''}`}
                                         onClick={() => slot.available && selectTime(slot.time)}
                                         disabled={!slot.available}
                                       >
                                         {slot.time}
                                       </button>
                                     ))}
                                   </div>
                                 </div>
                               )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="step-navigation">
                  <button className="booking-nav-button" onClick={() => goToStep(2)}>
                    <i className="fas fa-arrow-left booking-nav-button-icon"></i>
                    <span>{t('booking.navigation.previous')}</span>
                  </button>
                  <button
                    className="booking-nav-button primary"
                    onClick={() => goToStep(4)}
                    disabled={!canGoToNextStep()}
                  >
                    <span>{t('booking.navigation.next')}: {t('booking.steps.yourDetails')}</span>
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
                  <h2 className="section-title">{t('booking.step4.title')}</h2>
                </div>
                <p className="section-subtitle">{t('booking.step4.subtitle')}</p>

                <div className="step-content">
                  <form className="customer-form" onSubmit={handleSubmitBooking}>
                    {/* First Name + Last Name (side by side) */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="first-name">{t('booking.step4.firstName')} {t('booking.step4.required')}</label>
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
                      <label className="form-label" htmlFor="last-name">{t('booking.step4.lastName')} {t('booking.step4.required')}</label>
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

                    {/* Email (full width) */}
                    <div className="form-group full-width">
                      <label className="form-label" htmlFor="email">{t('booking.step4.email')} {t('booking.step4.required')}</label>
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

                    {/* Phone (country code select + number) */}
                    <div className="form-group full-width">
                      <label className="form-label" htmlFor="phone">{t('booking.step4.phone')} {t('booking.step4.required')}</label>
                      <div className="phone-input-wrapper">
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

                     {/* /!* Birthday (full width with hint) *!/*/}
                     {/*<div className="form-group full-width">*/}
                     {/*  <label className="form-label" htmlFor="birthday">{t('booking.step4.birthday')}</label>*/}
                     {/*  <input*/}
                     {/*    type="date"*/}
                     {/*    className="form-input"*/}
                     {/*    id="birthday"*/}
                     {/*    value={bookingState.customerInfo.birthday}*/}
                     {/*    onChange={(e) => setBookingState(prev => ({*/}
                     {/*      ...prev,*/}
                     {/*      customerInfo: { ...prev.customerInfo, birthday: e.target.value }*/}
                     {/*    }))}*/}
                     {/*    max={new Date().toISOString().split('T')[0]}*/}
                     {/*  />*/}
                     {/*  <div className="form-hint">{t('booking.step4.birthdayHint')}</div>*/}
                     {/*</div>*/}

                    {/* Notes textarea (full width) */}
                    <div className="form-group full-width">
                      <label className="form-label" htmlFor="notes">{t('booking.step4.notes')}</label>
                      <textarea
                        className="form-input"
                        id="notes"
                        placeholder={t('booking.step4.notesPlaceholder')}
                        value={bookingState.customerInfo.notes}
                        onChange={(e) => setBookingState(prev => ({
                          ...prev,
                          customerInfo: { ...prev.customerInfo, notes: e.target.value }
                        }))}
                      ></textarea>
                    </div>

                    {/* GDPR & Terms Consent */}
                    <div className="form-group full-width">
                      <div className="gdpr-consent-container">
                        <input
                          type="checkbox"
                          id="gdpr"
                          checked={gdprAccepted}
                          onChange={(e) => setGdprAccepted(e.target.checked)}
                          required
                        />
                        <label htmlFor="gdpr" className="gdpr-consent-label">
                          {t('booking.step4.gdprConsent')}{' '}
                          <a href="/booking-terms" target="_blank" rel="noopener noreferrer">
                            {t('booking.step4.termsLink')}
                          </a>
                          {' '}{t('booking.step4.and')}{' '}
                          <a href="/booking-privacy" target="_blank" rel="noopener noreferrer">
                            {t('booking.step4.privacyLink')}
                          </a>
                        </label>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="step-navigation">
                  <button className="booking-nav-button" onClick={() => goToStep(3)}>
                    <i className="fas fa-arrow-left booking-nav-button-icon"></i>
                    <span>{t('booking.navigation.previous')}</span>
                  </button>
                  <button
                    type="submit"
                    className="booking-nav-button primary"
                    onClick={handleSubmitBooking}
                    disabled={submitting || !gdprAccepted}
                  >
                    {submitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin booking-nav-button-icon"></i>
                        <span>{t('booking.navigation.creatingBooking')}</span>
                      </>
                    ) : (
                      <>
                        <span>{t('booking.navigation.completeBooking')}</span>
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
          {/* Header */}
          <div className="summary-header">
            <h3 className="summary-title">{t('booking.summary.title')}</h3>
          </div>

          {/* Progress Bar */}
          <div className="summary-progress-bar">
            <div className={`progress-pill ${bookingState.currentStep >= 1 ? 'completed' : bookingState.currentStep === 1 ? 'current' : 'future'}`}></div>
            <div className={`progress-pill ${bookingState.currentStep >= 2 ? 'completed' : bookingState.currentStep === 2 ? 'current' : 'future'}`}></div>
            <div className={`progress-pill ${bookingState.currentStep >= 3 ? 'completed' : bookingState.currentStep === 3 ? 'current' : 'future'}`}></div>
            <div className={`progress-pill ${bookingState.currentStep >= 4 ? 'completed' : bookingState.currentStep === 4 ? 'current' : 'future'}`}></div>
          </div>

           {/* SERVICES Section */}
           <div className="summary-section">
             <div className="section-header-row">
               <span className="section-label">{t('booking.summary.services')}</span>
               {getSelectedServices().length > 0 && (
                 <a href="#" className="section-edit-link" onClick={(e) => { e.preventDefault(); goToStep(1); }}>{t('booking.step4.edit')}</a>
               )}
             </div>
             <div className="section-content">
               {getSelectedServices().length === 0 ? (
                 <div className="section-placeholder">{t('booking.summary.notSelected')}</div>
               ) : (
                 getSelectedServices().map(service => {
                   const price = service.discount_price && service.discount_price > 0 ? service.discount_price : service.price;
                   return (
                     <div key={service.id} className="section-item">
                       <div className="item-name">{getServiceName(service)}</div>
                       <div className="item-meta">
                         <span className="item-price">€ {(price / 100).toFixed(2)}</span>
                         <span className="item-duration">{service.duration} min</span>
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
           </div>

           <div className="summary-divider"></div>

           {/* SPECIALIST Section */}
           <div className="summary-section">
             <div className="section-header-row">
               <span className="section-label">{t('booking.steps.professional')}</span>
               {bookingState.selectedStaff && (
                 <a href="#" className="section-edit-link" onClick={(e) => { e.preventDefault(); goToStep(2); }}>{t('booking.step4.edit')}</a>
               )}
             </div>
             <div className="section-content">
               {!bookingState.selectedStaff ? (
                 <div className="section-placeholder">{t('booking.summary.notSelected')}</div>
               ) : (
                 <div className="specialist-item">
                   <div className="specialist-avatar">
                     {getSelectedStaffInfo()?.user.profile_photo_url ? (
                       <img src={getSelectedStaffInfo()?.user.profile_photo_url} alt="avatar" />
                     ) : (
                       <div className="avatar-initials">
                         {getSelectedStaffInfo()?.user.first_name.charAt(0)}{getSelectedStaffInfo()?.user.last_name.charAt(0)}
                       </div>
                     )}
                   </div>
                   <div className="specialist-info">
                     <div className="specialist-name">{getSelectedStaffInfo()?.user.first_name} {getSelectedStaffInfo()?.user.last_name}</div>
                     {getSelectedStaffInfo()?.user.position && (
                       <div className="specialist-role">{getSelectedStaffInfo()?.user.position}</div>
                     )}
                   </div>
                 </div>
               )}
             </div>
           </div>

           <div className="summary-divider"></div>

           {/* DATE & TIME Section */}
           <div className="summary-section">
             <div className="section-header-row">
               <span className="section-label">{t('booking.step3.title')}</span>
               {bookingState.selectedDate && bookingState.selectedTime && (
                 <a href="#" className="section-edit-link" onClick={(e) => { e.preventDefault(); goToStep(3); }}>{t('booking.step4.edit')}</a>
               )}
             </div>
             <div className="section-content">
               {!bookingState.selectedDate || !bookingState.selectedTime ? (
                 <div className="section-placeholder">{t('booking.summary.notSelected')}</div>
               ) : (
                 <div className="datetime-item">
                   <div className="datetime-value">
                     {new Date(bookingState.selectedDate).toLocaleDateString(getLocaleString(), { weekday: 'short', month: 'short', day: 'numeric' })} {t('booking.summary.at')} {bookingState.selectedTime}
                   </div>
                   <div className="datetime-duration">{t('booking.summary.totalDuration')}: {getTotalDuration()} min</div>
                 </div>
               )}
             </div>
           </div>

           <div className="summary-divider"></div>

           {/* CLIENT Section */}
           <div className="summary-section">
             <div className="section-header-row">
               <span className="section-label">{t('booking.step4.title')}</span>
               {(bookingState.customerInfo.firstName || bookingState.customerInfo.lastName) && (
                 <a href="#" className="section-edit-link" onClick={(e) => { e.preventDefault(); goToStep(4); }}>{t('booking.step4.edit')}</a>
               )}
             </div>
             <div className="section-content">
               {!bookingState.customerInfo.firstName && !bookingState.customerInfo.lastName ? (
                 <div className="section-placeholder">{t('booking.summary.notEntered')}</div>
               ) : (
                 <div className="client-item">
                   {bookingState.customerInfo.firstName} {bookingState.customerInfo.lastName}
                 </div>
               )}
             </div>
           </div>

           <div className="summary-divider"></div>

           {/* Total Row */}
           <div className="summary-total">
             <div className="summary-total-label">{t('booking.summary.total')}</div>
             <div className="summary-total-price">€ {calculateTotal().toFixed(2)}</div>
           </div>
        </div>
      </div>

      {/* Mobile Summary Drawer */}
      {showMobileSummary && (
        <>
          {/* Overlay */}
          <div
            className="mobile-summary-overlay"
            onClick={() => setShowMobileSummary(false)}
          ></div>

          {/* Drawer */}
          <div className="mobile-summary-drawer">
            {/* Close Button */}
            <div className="drawer-header">
              <h3 className="drawer-title">{t('booking.summary.title')}</h3>
              <button
                className="drawer-close-btn"
                onClick={() => setShowMobileSummary(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="summary-progress-bar">
              <div className={`progress-pill ${bookingState.currentStep >= 1 ? 'completed' : bookingState.currentStep === 1 ? 'current' : 'future'}`}></div>
              <div className={`progress-pill ${bookingState.currentStep >= 2 ? 'completed' : bookingState.currentStep === 2 ? 'current' : 'future'}`}></div>
              <div className={`progress-pill ${bookingState.currentStep >= 3 ? 'completed' : bookingState.currentStep === 3 ? 'current' : 'future'}`}></div>
              <div className={`progress-pill ${bookingState.currentStep >= 4 ? 'completed' : bookingState.currentStep === 4 ? 'current' : 'future'}`}></div>
            </div>

            {/* Content */}
            <div className="drawer-content">
              {/* SERVICES Section */}
              <div className="summary-section">
                <div className="section-header-row">
                  <span className="section-label">{t('booking.summary.services')}</span>
                  {getSelectedServices().length > 0 && (
                    <a href="#" className="section-edit-link" onClick={(e) => { e.preventDefault(); setShowMobileSummary(false); goToStep(1); }}>{t('booking.step4.edit')}</a>
                  )}
                </div>
                <div className="section-content">
                  {getSelectedServices().length === 0 ? (
                    <div className="section-placeholder">{t('booking.summary.notSelected')}</div>
                  ) : (
                    getSelectedServices().map(service => {
                      const price = service.discount_price && service.discount_price > 0 ? service.discount_price : service.price;
                      return (
                        <div key={service.id} className="section-item">
                          <div className="item-name">{getServiceName(service)}</div>
                          <div className="item-meta">
                            <span className="item-price">€ {(price / 100).toFixed(2)}</span>
                            <span className="item-duration">{service.duration} min</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="summary-divider"></div>

              {/* SPECIALIST Section */}
              <div className="summary-section">
                <div className="section-header-row">
                  <span className="section-label">{t('booking.steps.professional')}</span>
                  {bookingState.selectedStaff && (
                    <a href="#" className="section-edit-link" onClick={(e) => { e.preventDefault(); setShowMobileSummary(false); goToStep(2); }}>{t('booking.step4.edit')}</a>
                  )}
                </div>
                <div className="section-content">
                  {!bookingState.selectedStaff ? (
                    <div className="section-placeholder">{t('booking.summary.notSelected')}</div>
                  ) : (
                    <div className="specialist-item">
                      <div className="specialist-avatar">
                        {getSelectedStaffInfo()?.user.profile_photo_url ? (
                          <img src={getSelectedStaffInfo()?.user.profile_photo_url} alt="avatar" />
                        ) : (
                          <div className="avatar-initials">
                            {getSelectedStaffInfo()?.user.first_name.charAt(0)}{getSelectedStaffInfo()?.user.last_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="specialist-info">
                        <div className="specialist-name">{getSelectedStaffInfo()?.user.first_name} {getSelectedStaffInfo()?.user.last_name}</div>
                        {getSelectedStaffInfo()?.user.position && (
                          <div className="specialist-role">{getSelectedStaffInfo()?.user.position}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="summary-divider"></div>

              {/* DATE & TIME Section */}
              <div className="summary-section">
                <div className="section-header-row">
                  <span className="section-label">{t('booking.step3.title')}</span>
                  {bookingState.selectedDate && bookingState.selectedTime && (
                    <a href="#" className="section-edit-link" onClick={(e) => { e.preventDefault(); setShowMobileSummary(false); goToStep(3); }}>{t('booking.step4.edit')}</a>
                  )}
                </div>
                <div className="section-content">
                  {!bookingState.selectedDate || !bookingState.selectedTime ? (
                    <div className="section-placeholder">{t('booking.summary.notSelected')}</div>
                  ) : (
                    <div className="datetime-item">
                      <div className="datetime-value">
                        {new Date(bookingState.selectedDate).toLocaleDateString(getLocaleString(), { weekday: 'short', month: 'short', day: 'numeric' })} {t('booking.summary.at')} {bookingState.selectedTime}
                      </div>
                      <div className="datetime-duration">{t('booking.summary.totalDuration')}: {getTotalDuration()} min</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="summary-divider"></div>

              {/* CLIENT Section */}
              <div className="summary-section">
                <div className="section-header-row">
                  <span className="section-label">{t('booking.step4.title')}</span>
                  {(bookingState.customerInfo.firstName || bookingState.customerInfo.lastName) && (
                    <a href="#" className="section-edit-link" onClick={(e) => { e.preventDefault(); setShowMobileSummary(false); goToStep(4); }}>{t('booking.step4.edit')}</a>
                  )}
                </div>
                <div className="section-content">
                  {!bookingState.customerInfo.firstName && !bookingState.customerInfo.lastName ? (
                    <div className="section-placeholder">{t('booking.summary.notEntered')}</div>
                  ) : (
                    <div className="client-item">
                      {bookingState.customerInfo.firstName} {bookingState.customerInfo.lastName}
                    </div>
                  )}
                </div>
              </div>

              <div className="summary-divider"></div>

              {/* Total Row */}
              <div className="summary-total">
                <div className="summary-total-label">{t('booking.summary.total')}</div>
                <div className="summary-total-price">€ {calculateTotal().toFixed(2)}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Summary Side Tab */}
      <div
        className="mobile-summary-tab"
        onClick={() => setShowMobileSummary(true)}
      >
        <div className="tab-content">
          <div className="tab-icon">
            <i className="fas fa-chevron-left"></i>
          </div>
          <div className="tab-label">{t('booking.summary.title')}</div>
        </div>
      </div>
    </div>
  );
};

export default PublicBookingPage;

