export interface BookingService {
  id: string;
  service_id: string;
  user_id: string;
  assigned_staff?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  category_service?: {
    id: string;
    name: string;
    duration: number;
    price: number;
    discount_price?: number;
  };
}

export interface Booking {
  id: string;
  start_at: string;  // API returns start_at
  end_at: string;    // API returns end_at
  status: 'pending' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  total_price: number;
  customer?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  booking_services: BookingService[];
  notes?: string;
  description?: string;
  user_ids?: string[];
}

export interface TimeOff {
  id: string;
  start_date: string;  // API returns start_date
  end_date: string;    // API returns end_date
  user_id: string;
  reason?: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface CreateBookingData {
  start_time: string;
  notes?: string;
  services: Array<{
    category_service_id: string;
    user_id: string;
    notes?: string;
  }>;
  customer_info: {
    id?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}

export interface CreateTimeOffData {
  start_date: string;
  end_date: string;
  user_id: string;
  reason?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  type: 'booking' | 'timeoff';
  originalEvent: Booking | TimeOff;
  staffIds?: string[];
}

