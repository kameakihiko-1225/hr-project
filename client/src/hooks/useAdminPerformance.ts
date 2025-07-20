import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LocalizedContent } from '@shared/schema';
import { useTranslation } from 'react-i18next';

// Performance optimization hook for admin operations
export const useAdminPerformance = () => {
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();

  // Memoized localization helper to prevent re-computation
  const getLocalizedContent = useCallback((content: string | LocalizedContent): string => {
    if (typeof content === 'string') return content;
    return content[i18n.language as keyof LocalizedContent] || content.en || '';
  }, [i18n.language]);

  // Optimized cache invalidation for related data
  const invalidateRelatedQueries = useCallback((entityType: 'companies' | 'departments' | 'positions') => {
    const relatedQueries = {
      companies: ['companies', 'departments', 'positions', 'dashboardStats'],
      departments: ['departments', 'positions', 'dashboardStats'],
      positions: ['positions', 'dashboardStats', 'all-applied-positions']
    };

    relatedQueries[entityType].forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    });
  }, [queryClient]);

  // Batch API requests for better performance
  const useBatchedAdminData = () => {
    return useQuery({
      queryKey: ['admin-batch-data'],
      queryFn: async () => {
        // Fetch all admin data in parallel
        const [companiesRes, departmentsRes, positionsRes, statsRes] = await Promise.allSettled([
          fetch('/api/companies?raw=true').then(res => res.json()),
          fetch('/api/departments?raw=true&includePositions=true').then(res => res.json()),
          fetch('/api/positions?raw=true').then(res => res.json()),
          fetch('/api/dashboard/stats').then(res => res.json())
        ]);

        return {
          companies: companiesRes.status === 'fulfilled' ? companiesRes.value : { success: false, data: [] },
          departments: departmentsRes.status === 'fulfilled' ? departmentsRes.value : { success: false, data: [] },
          positions: positionsRes.status === 'fulfilled' ? positionsRes.value : { success: false, data: [] },
          stats: statsRes.status === 'fulfilled' ? statsRes.value : { success: false, data: null }
        };
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 2
    });
  };

  // Optimized search with debouncing
  const useOptimizedSearch = <T>(data: T[], searchFields: (keyof T)[], searchTerm: string) => {
    return useMemo(() => {
      if (!searchTerm.trim()) return data;
      
      const lowercaseSearch = searchTerm.toLowerCase();
      return data.filter(item => {
        return searchFields.some(field => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(lowercaseSearch);
          }
          if (typeof value === 'object' && value !== null) {
            // Handle LocalizedContent objects
            const localizedValue = getLocalizedContent(value as LocalizedContent);
            return localizedValue.toLowerCase().includes(lowercaseSearch);
          }
          return false;
        });
      });
    }, [data, searchFields, searchTerm, getLocalizedContent]);
  };

  return {
    getLocalizedContent,
    invalidateRelatedQueries,
    useBatchedAdminData,
    useOptimizedSearch
  };
};