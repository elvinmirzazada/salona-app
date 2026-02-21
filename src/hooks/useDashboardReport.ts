/**
 * Custom hooks for dashboard reports using TanStack Query
 * Provides 1-day caching for predefined periods, no caching for custom ranges
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ReportsManager } from '../utils/ReportsManager';

const reportsManager = new ReportsManager();

/**
 * Clear the ReportsManager in-memory cache.
 * Call this before refetch() so the internal 5-minute cache doesn't serve stale data.
 */
export const clearReportsCache = () => {
  reportsManager.clearCache();
};

/**
 * Hook to fetch dashboard report with TanStack Query caching
 * Caching disabled for custom date ranges
 */
export const useDashboardReport = (
  period: string,
  customStartDate?: string,
  customEndDate?: string,
  enabled: boolean = true,
  userId?: string // Add user ID for cache isolation
) => {
  return useQuery({
    queryKey: ['dashboard-report', userId, period, customStartDate, customEndDate], // Include userId in key
    queryFn: async () => {
      console.log(`Fetching report for period: ${period}${period === 'custom' ? ` (${customStartDate} to ${customEndDate})` : ''} for user ${userId}`);

      const reportData = period === 'custom'
        ? await reportsManager.generateBookingsReport(period, customStartDate, customEndDate)
        : await reportsManager.generateBookingsReport(period);

      if (!reportData) {
        throw new Error('Failed to fetch report data');
      }

      return reportData;
    },
    enabled, // Only run query if enabled
    staleTime: period === 'custom' ? 0 : 24 * 60 * 60 * 1000, // No cache for custom, 1 day for others
    gcTime: period === 'custom' ? 0 : 24 * 60 * 60 * 1000, // No garbage collection cache for custom
    refetchOnMount: period === 'custom', // Always refetch custom ranges on mount
    refetchOnWindowFocus: false,
    retry: 1,
  });
};

/**
 * Hook to manually invalidate and refetch report data
 */
export const useInvalidateReport = () => {
  const queryClient = useQueryClient();

  const invalidateReport = (userId: string | undefined, period: string, customStartDate?: string, customEndDate?: string) => {
    // Use removeQueries to fully clear cached data so staleTime doesn't prevent a fresh fetch
    queryClient.removeQueries({
      queryKey: ['dashboard-report', userId, period, customStartDate, customEndDate]
    });
  };

  const invalidateAllReports = () => {
    queryClient.removeQueries({
      queryKey: ['dashboard-report']
    });
  };

  return { invalidateReport, invalidateAllReports };
};

