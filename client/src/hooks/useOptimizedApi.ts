import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { queryKeys, invalidateRelatedQueries, apiRequest } from '@/lib/queryClient';
import type { Company, Department, Position } from '@shared/schema';

// Optimized hook for fetching companies with caching and localization
export const useCompanies = (raw = false) => {
  const { i18n } = useTranslation();
  
  return useQuery({
    queryKey: queryKeys.companies(i18n.language, raw),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (!raw) params.append('language', i18n.language);
      if (raw) params.append('raw', 'true');
      
      const url = `/api/companies${params.toString() ? '?' + params.toString() : ''}`;
      return apiRequest(url);
    },
    staleTime: raw ? 0 : 5 * 60 * 1000, // 5 minutes for public, no cache for admin
    gcTime: raw ? 0 : 10 * 60 * 1000,
  });
};

// Optimized hook for fetching departments with caching and localization
export const useDepartments = (companyId?: string, includePositions = false, raw = false) => {
  const { i18n } = useTranslation();
  
  return useQuery({
    queryKey: queryKeys.departments(companyId, i18n.language, includePositions, raw),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (companyId && companyId !== 'all') params.append('companyId', companyId);
      if (includePositions) params.append('includePositions', 'true');
      if (!raw) params.append('language', i18n.language);
      if (raw) params.append('raw', 'true');
      
      const url = `/api/departments${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiRequest(url);
      return response.data || [];
    },
    staleTime: raw ? 0 : 3 * 60 * 1000, // 3 minutes for public, no cache for admin
    gcTime: raw ? 0 : 6 * 60 * 1000,
  });
};

// Optimized hook for fetching positions with caching and localization
export const usePositions = (departmentId?: number, raw = false) => {
  const { i18n } = useTranslation();
  
  return useQuery({
    queryKey: queryKeys.positions(departmentId, i18n.language, raw),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (departmentId) params.append('departmentId', departmentId.toString());
      if (!raw) params.append('language', i18n.language);
      if (raw) params.append('raw', 'true');
      
      const url = `/api/positions${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiRequest(url);
      return response.data || [];
    },
    staleTime: raw ? 0 : 2 * 60 * 1000, // 2 minutes for public, no cache for admin
    gcTime: raw ? 0 : 4 * 60 * 1000,
  });
};

// Optimized hook for fetching industry tags with caching and localization
export const useIndustryTags = () => {
  const { i18n } = useTranslation();
  
  return useQuery({
    queryKey: queryKeys.industryTags(i18n.language),
    queryFn: async () => {
      const response = await apiRequest(`/api/industry-tags?language=${i18n.language}`);
      return response.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - industry tags change rarely
    gcTime: 20 * 60 * 1000,
  });
};

// Optimized mutation hooks with cache invalidation
export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (companyData: any) => {
      return apiRequest('/api/companies', {
        method: 'POST',
        body: JSON.stringify(companyData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/companies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, { id }) => {
      invalidateRelatedQueries.company(id);
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/companies/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (_, id) => {
      invalidateRelatedQueries.company(id);
    },
  });
};

// Similar patterns for departments and positions
export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (departmentData: any) => {
      return apiRequest('/api/departments', {
        method: 'POST',
        body: JSON.stringify(departmentData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
  });
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/departments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, { id }) => {
      invalidateRelatedQueries.department(id);
    },
  });
};

export const useCreatePosition = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (positionData: any) => {
      return apiRequest('/api/positions', {
        method: 'POST',
        body: JSON.stringify(positionData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['applied-positions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useUpdatePosition = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/positions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, { id }) => {
      invalidateRelatedQueries.position(id);
    },
  });
};

export const useDeletePosition = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/positions/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (_, id) => {
      invalidateRelatedQueries.position(id);
    },
  });
};