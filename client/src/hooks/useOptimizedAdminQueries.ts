import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

// Optimized admin queries for better performance
export const useOptimizedAdminQueries = () => {
  const queryClient = useQueryClient();

  // Batch query for all admin data
  const useAdminBatchData = () => {
    return useQuery({
      queryKey: ['admin', 'batch-data'],
      queryFn: async () => {
        const response = await fetch('/api/admin/batch-data');
        if (!response.ok) throw new Error('Failed to fetch admin data');
        const result = await response.json();
        return result.data;
      },
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 2
    });
  };

  // Optimized positions query with filters
  const useOptimizedPositions = (departmentId?: string, includeStats = true) => {
    return useQuery({
      queryKey: ['admin', 'positions-batch', departmentId, includeStats],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (departmentId && departmentId !== 'all') {
          params.append('departmentId', departmentId);
        }
        if (includeStats) {
          params.append('includeStats', 'true');
        }
        
        const response = await fetch(`/api/admin/positions-batch?${params}`);
        if (!response.ok) throw new Error('Failed to fetch positions');
        const result = await response.json();
        return result.data;
      },
      staleTime: 90 * 1000, // 90 seconds for positions (more dynamic)
      gcTime: 3 * 60 * 1000, // 3 minutes
      refetchOnWindowFocus: false,
      enabled: true
    });
  };

  // Optimized dashboard stats
  const useOptimizedDashboard = () => {
    return useQuery({
      queryKey: ['admin', 'dashboard-optimized'],
      queryFn: async () => {
        const response = await fetch('/api/admin/dashboard-optimized');
        if (!response.ok) throw new Error('Failed to fetch dashboard');
        const result = await response.json();
        return result.data;
      },
      staleTime: 60 * 1000, // 1 minute for dashboard
      gcTime: 3 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchInterval: 60 * 1000 // Auto-refresh every minute
    });
  };

  // Optimized CRUD operations with cache updates
  const useOptimizedCRUD = () => {
    // Generic mutation with optimistic updates
    const createMutation = useMutation({
      mutationFn: async ({ endpoint, data }: { endpoint: string; data: any }) => {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create');
        return response.json();
      },
      onSuccess: (_, { endpoint }) => {
        // Invalidate relevant queries based on endpoint
        if (endpoint.includes('companies')) {
          queryClient.invalidateQueries({ queryKey: ['admin', 'batch-data'] });
          queryClient.invalidateQueries({ queryKey: ['companies'] });
        }
        if (endpoint.includes('positions')) {
          queryClient.invalidateQueries({ queryKey: ['admin', 'positions-batch'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'batch-data'] });
        }
        if (endpoint.includes('departments')) {
          queryClient.invalidateQueries({ queryKey: ['admin', 'positions-batch'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'batch-data'] });
        }
        
        toast({
          title: "Success",
          description: "Item created successfully"
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create item",
          variant: "destructive"
        });
      }
    });

    const updateMutation = useMutation({
      mutationFn: async ({ endpoint, data }: { endpoint: string; data: any }) => {
        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update');
        return response.json();
      },
      onSuccess: (_, { endpoint }) => {
        // Smart cache invalidation
        const entityType = endpoint.includes('companies') ? 'companies' : 
                          endpoint.includes('positions') ? 'positions' : 
                          endpoint.includes('departments') ? 'departments' : 'all';
        
        invalidateQueriesForEntity(entityType);
        
        toast({
          title: "Success", 
          description: "Item updated successfully"
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to update item",
          variant: "destructive"
        });
      }
    });

    const deleteMutation = useMutation({
      mutationFn: async ({ endpoint }: { endpoint: string }) => {
        const response = await fetch(endpoint, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete');
        return response.json();
      },
      onSuccess: (_, { endpoint }) => {
        const entityType = endpoint.includes('companies') ? 'companies' : 
                          endpoint.includes('positions') ? 'positions' : 
                          endpoint.includes('departments') ? 'departments' : 'all';
        
        invalidateQueriesForEntity(entityType);
        
        toast({
          title: "Success",
          description: "Item deleted successfully"
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error", 
          description: error.message || "Failed to delete item",
          variant: "destructive"
        });
      }
    });

    return { createMutation, updateMutation, deleteMutation };
  };

  // Smart cache invalidation
  const invalidateQueriesForEntity = useCallback((entityType: string) => {
    const queryKeysToInvalidate = [
      ['admin', 'batch-data'],
      ['admin', 'dashboard-optimized']
    ];

    if (entityType === 'companies' || entityType === 'all') {
      queryKeysToInvalidate.push(['companies']);
    }
    if (entityType === 'positions' || entityType === 'all') {
      queryKeysToInvalidate.push(['admin', 'positions-batch']);
      queryKeysToInvalidate.push(['positions']);
    }
    if (entityType === 'departments' || entityType === 'all') {
      queryKeysToInvalidate.push(['departments']);
    }

    queryKeysToInvalidate.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey });
    });
  }, [queryClient]);

  // Prefetch related data for better UX
  const prefetchRelatedData = useCallback(async (entityType: string) => {
    if (entityType === 'positions') {
      // Prefetch companies and departments when viewing positions
      queryClient.prefetchQuery({
        queryKey: ['companies'],
        queryFn: () => fetch('/api/companies?raw=true').then(r => r.json()),
        staleTime: 60 * 1000
      });
    }
  }, [queryClient]);

  return {
    useAdminBatchData,
    useOptimizedPositions,
    useOptimizedDashboard,
    useOptimizedCRUD,
    invalidateQueriesForEntity,
    prefetchRelatedData
  };
};