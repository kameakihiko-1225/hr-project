import { QueryClient } from '@tanstack/react-query';

// Configure React Query for optimal performance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
      
      // Retry failed requests
      retry: (failureCount, error) => {
        // Don't retry 4xx errors (client errors)
        if (error instanceof Error && error.message.includes('4')) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      
      // Enable background refetching for better UX
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      
      // Reduce network requests for background updates
      refetchOnMount: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Custom query keys for different data types with cache invalidation strategies
export const queryKeys = {
  companies: (language?: string, raw?: boolean) => 
    ['companies', language || 'en', raw ? 'raw' : 'public'] as const,
  company: (id: number, language?: string, raw?: boolean) => 
    ['companies', id, language || 'en', raw ? 'raw' : 'public'] as const,
  departments: (companyId?: string, language?: string, includePositions?: boolean, raw?: boolean) => 
    ['departments', companyId || 'all', language || 'en', includePositions ? 'with-positions' : 'basic', raw ? 'raw' : 'public'] as const,
  department: (id: number, language?: string) => 
    ['departments', id, language || 'en'] as const,
  positions: (departmentId?: number, language?: string, raw?: boolean) => 
    ['positions', departmentId || 'all', language || 'en', raw ? 'raw' : 'public'] as const,
  position: (id: number, language?: string) => 
    ['positions', id, language || 'en'] as const,
  industryTags: (language?: string) => 
    ['industry-tags', language || 'en'] as const,
  dashboardStats: () => ['dashboard', 'stats'] as const,
  clickStats: () => ['dashboard', 'click-stats'] as const,
  appliedPositions: () => ['applied-positions'] as const,
  topAppliedPositions: () => ['top-applied-positions'] as const,
  positionStats: (positionId?: number) => 
    ['positions', 'stats', positionId || 'all'] as const,
};

// Utility function to invalidate related caches
export const invalidateRelatedQueries = {
  company: (companyId: number) => {
    queryClient.invalidateQueries({ queryKey: ['companies'] });
    queryClient.invalidateQueries({ queryKey: ['companies', companyId] });
    queryClient.invalidateQueries({ queryKey: ['departments'] }); // Companies affect departments
  },
  department: (departmentId: number, companyId?: number) => {
    queryClient.invalidateQueries({ queryKey: ['departments'] });
    queryClient.invalidateQueries({ queryKey: ['departments', departmentId] });
    queryClient.invalidateQueries({ queryKey: ['positions'] }); // Departments affect positions
    if (companyId) {
      queryClient.invalidateQueries({ queryKey: ['companies', companyId] });
    }
  },
  position: (positionId: number, departmentId?: number) => {
    queryClient.invalidateQueries({ queryKey: ['positions'] });
    queryClient.invalidateQueries({ queryKey: ['positions', positionId] });
    queryClient.invalidateQueries({ queryKey: ['applied-positions'] });
    queryClient.invalidateQueries({ queryKey: ['top-applied-positions'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    if (departmentId) {
      queryClient.invalidateQueries({ queryKey: ['departments', departmentId] });
    }
  },
};

// Optimized API request function with better error handling
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
};