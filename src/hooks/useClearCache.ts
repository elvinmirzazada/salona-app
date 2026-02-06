/**
 * Utility hook for clearing TanStack Query cache
 * Use this when user logs out or when you need to clear all cached data
 */
import { useQueryClient } from '@tanstack/react-query';

export const useClearCache = () => {
  const queryClient = useQueryClient();

  /**
   * Clear all TanStack Query cache
   * Use this on logout to prevent data leakage between users
   */
  const clearAllCache = () => {
    queryClient.clear();
    console.log('✅ All TanStack Query cache cleared');
  };

  /**
   * Clear specific query cache by key
   */
  const clearQueryCache = (queryKey: unknown[]) => {
    queryClient.removeQueries({ queryKey });
    console.log(`✅ Cache cleared for query: ${JSON.stringify(queryKey)}`);
  };

  /**
   * Invalidate specific query to force refetch
   */
  const invalidateQuery = (queryKey: unknown[]) => {
    queryClient.invalidateQueries({ queryKey });
    console.log(`✅ Query invalidated: ${JSON.stringify(queryKey)}`);
  };

  return {
    clearAllCache,
    clearQueryCache,
    invalidateQuery,
  };
};

