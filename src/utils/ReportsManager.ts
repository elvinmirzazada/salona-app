/**
 * Reports and Analytics Module
 * Handles data aggregation and report generation for the dashboard
 */
import { apiClient } from './api';

export interface Booking {
  id: string;
  status: string;
  start_at: string;
  total_price: number;
  booking_services: BookingService[];
}

export interface BookingService {
  assigned_staff: {
    id: string;
    first_name: string;
    last_name: string;
  };
  category_service: {
    name: string;
    price: number;
    discount_price: number;
  };
  price: number;
}

export interface ReportData {
  period: string;
  start_date: string;
  end_date: string;
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  pending_bookings: number;
  total_revenue: number;
  average_booking_value: number;
  completion_rate: number;
  bookings_by_day: Record<string, number>;
  revenue_by_day: Record<string, number>;
  bookings_by_staff: Record<string, StaffData>;
  bookings_by_service: Record<string, ServiceData>;
  status_breakdown: Record<string, number>;
  comparison: {
    bookings_change: number;
    revenue_change: number;
  };
  staff_performance: StaffPerformance[];
}

export interface StaffData {
  name: string;
  count: number;
  revenue: number;
}

export interface ServiceData {
  count: number;
  revenue: number;
}

export interface StaffPerformance {
  id: string;
  name: string;
  bookings: number;
  revenue: number;
  average_per_booking: number;
}

export class ReportsManager {
  private cache: Map<string, { data: ReportData; timestamp: number }> = new Map();
  private cacheExpiryMinutes: number = 5; // Cache expires after 5 minutes

  constructor() {
    // No-op constructor
  }

  /**
   * Generate cache key for a report request
   */
  private getCacheKey(period: string, customStartDate?: string, customEndDate?: string): string {
    if (period === 'custom' && customStartDate && customEndDate) {
      return `${period}-${customStartDate}-${customEndDate}`;
    }
    return period;
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(timestamp: number): boolean {
    const now = Date.now();
    const expiryTime = this.cacheExpiryMinutes * 60 * 1000; // Convert to milliseconds
    return (now - timestamp) < expiryTime;
  }

  /**
   * Get cached report data if available and valid
   */
  private getCachedReport(cacheKey: string): ReportData | null {
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached.timestamp)) {
      console.log(`Using cached report for ${cacheKey}`);
      return cached.data;
    }

    // Remove expired cache entry
    if (cached) {
      this.cache.delete(cacheKey);
    }

    return null;
  }

  /**
   * Store report data in cache
   */
  private setCachedReport(cacheKey: string, data: ReportData): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    console.log(`Cached report for ${cacheKey}`);
  }

  /**
   * Clear all cached reports (useful for testing or manual refresh)
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('Report cache cleared');
  }

  /**
   * Force refresh a specific period by clearing its cache and regenerating
   */
  public async refreshPeriodData(period: string): Promise<ReportData | null> {
    const cacheKey = this.getCacheKey(period);
    this.cache.delete(cacheKey);
    console.log(`Cleared cache for ${period}, regenerating...`);
    return await this.generateBookingsReport(period);
  }

  /**
   * Fetch bookings from the API for a given date range
   */
  async fetchBookings(startDate: string, endDate?: string): Promise<Booking[] | null> {
    try {
      const params = new URLSearchParams({
        start_date: startDate,
      });

      if (endDate) {
        params.append('end_date', endDate);
      }

      const response = await apiClient.get('/v1/bookings', {
        params: Object.fromEntries(params.entries()),
      });
      const data = response.data;
      return data.data || [];
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return null;
    }
  }

  /**
   * Generate comprehensive bookings report
   */
  async generateBookingsReport(
    period: string = 'week',
    customStartDate?: string,
    customEndDate?: string
  ): Promise<ReportData | null> {
    // Check cache first for all periods (including custom)
    const cacheKey = this.getCacheKey(period, customStartDate, customEndDate);
    const cachedData = this.getCachedReport(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    console.log(`Generating fresh report for ${cacheKey}`);

    const today = new Date();
    let startDate: Date;
    let endDate: Date;
    let previousStart: Date;

    // Handle custom date range
    if (period === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);

      // Calculate previous period of same length for comparison
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      previousStart = new Date(startDate.getTime() - (daysDiff * 24 * 60 * 60 * 1000));

      console.log(`Custom date range: ${customStartDate} to ${customEndDate} (${daysDiff} days)`);
    } else {
      // Use current date as end date for predefined periods
      endDate = today;

      // Calculate date range based on period
      switch (period) {
        case 'week':
          startDate = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
          previousStart = new Date(startDate.getTime() - (7 * 24 * 60 * 60 * 1000));
          break;
        case 'month':
          startDate = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
          previousStart = new Date(startDate.getTime() - (30 * 24 * 60 * 60 * 1000));
          break;
        case 'year':
          startDate = new Date(today.getTime() - (365 * 24 * 60 * 60 * 1000));
          previousStart = new Date(startDate.getTime() - (365 * 24 * 60 * 60 * 1000));
          break;
        default:
          startDate = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
          previousStart = new Date(startDate.getTime() - (7 * 24 * 60 * 60 * 1000));
      }
    }

    // Fetch current period bookings
    const currentBookings = await this.fetchBookings(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    // Fetch previous period bookings for comparison
    const previousBookings = await this.fetchBookings(
      previousStart.toISOString().split('T')[0],
      startDate.toISOString().split('T')[0]
    );

    if (currentBookings === null) {
      return null;
    }

    // Initialize report structure
    const report: ReportData = {
      period,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      total_bookings: 0,
      completed_bookings: 0,
      cancelled_bookings: 0,
      pending_bookings: 0,
      total_revenue: 0,
      average_booking_value: 0,
      completion_rate: 0,
      bookings_by_day: {},
      revenue_by_day: {},
      bookings_by_staff: {},
      bookings_by_service: {},
      status_breakdown: {
        completed: 0,
        pending: 0,
        cancelled: 0,
        confirmed: 0,
        no_show: 0
      },
      comparison: {
        bookings_change: 0,
        revenue_change: 0
      },
      staff_performance: []
    };

    // Process current period bookings
    for (const booking of currentBookings) {
      report.total_bookings += 1;

      // Convert cents to dollars
      const totalPrice = (booking.total_price || 0) / 100;

      // Count by status
      const status = (booking.status || 'pending').toLowerCase();
      if (status in report.status_breakdown) {
        report.status_breakdown[status] += 1;
      }

      if (status === 'completed') {
        report.completed_bookings += 1;
        report.total_revenue += totalPrice;
      } else if (status === 'cancelled') {
        report.cancelled_bookings += 1;
      } else {
        report.pending_bookings += 1;
      }

      // Group by day
      const bookingDate = booking.start_at?.split('T')[0];
      if (bookingDate) {
        const dayName = new Date(bookingDate).toLocaleDateString('en-US', { weekday: 'short' });
        report.bookings_by_day[dayName] = (report.bookings_by_day[dayName] || 0) + 1;

        if (status === 'completed') {
          report.revenue_by_day[dayName] = (report.revenue_by_day[dayName] || 0) + totalPrice;
        }
      }

      // Group by staff and service
      for (const service of booking.booking_services || []) {
        const staffId = service.assigned_staff?.id || 'unassigned';
        const firstName = service.assigned_staff?.first_name || '';
        const lastName = service.assigned_staff?.last_name || '';
        const staffName = `${firstName} ${lastName}`.trim() || 'Unassigned';

        // Staff data
        if (!report.bookings_by_staff[staffId]) {
          report.bookings_by_staff[staffId] = {
            name: staffName,
            count: 0,
            revenue: 0
          };
        }
        report.bookings_by_staff[staffId].count = 1;
        if (status === 'completed') {
          report.bookings_by_staff[staffId].revenue += (service.category_service.discount_price || service.category_service.price || 0) / 100;
        }

        // Service data
        const serviceName = service.category_service?.name || 'Unknown';
        if (!report.bookings_by_service[serviceName]) {
          report.bookings_by_service[serviceName] = {
            count: 0,
            revenue: 0
          };
        }
        report.bookings_by_service[serviceName].count += 1;
        if (status === 'completed') {
          const servicePrice = (service.price || 0) / 100;
          report.bookings_by_service[serviceName].revenue += servicePrice;
        }
      }
    }

    // Calculate averages and completion rate
    if (report.completed_bookings > 0) {
      report.average_booking_value = report.total_revenue / report.completed_bookings;
    }

    if (report.total_bookings > 0) {
      report.completion_rate = (report.completed_bookings / report.total_bookings) * 100;
    }

    // Calculate comparison with previous period
    if (previousBookings && previousBookings.length > 0) {
      const prevTotal = previousBookings.length;
      const prevRevenue = previousBookings
        .filter(b => (b.status || '').toLowerCase() === 'completed')
        .reduce((sum, b) => sum + ((b.total_price || 0) / 100), 0);

      if (prevTotal > 0) {
        report.comparison.bookings_change =
          ((report.total_bookings - prevTotal) / prevTotal) * 100;
      }

      if (prevRevenue > 0) {
        report.comparison.revenue_change =
          ((report.total_revenue - prevRevenue) / prevRevenue) * 100;
      }
    }

    // Generate staff performance array
    report.staff_performance = Object.entries(report.bookings_by_staff).map(([id, data]) => ({
      id,
      name: data.name,
      bookings: data.count,
      revenue: data.revenue,
      average_per_booking: data.count > 0 ? data.revenue / data.count : 0
    }));

    // Cache the report before returning
    this.setCachedReport(cacheKey, report);

    return report;
  }

  /**
   * Generate customer analytics report
   */
  async generateCustomerReport(): Promise<any> {
    // This will be implemented when we have customer endpoint data
    return null;
  }

  /**
   * Generate staff performance report
   */
  async generateStaffPerformanceReport(): Promise<any> {
    // This will be implemented with more detailed staff data
    return null;
  }
}
