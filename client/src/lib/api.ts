// API functions for JobPositionPage and other components
import { Position, Company, Department } from '@shared/schema';

// Export API base URL for other components  
export const API_BASE_URL = '/api';

// Optimized fetch function with better performance
const optimizedFetch = async (url: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        ...options.headers,
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};



// Individual entity fetchers for job position pages with optimized performance
export const getPositionById = async (id: number): Promise<Position> => {
  const response = await optimizedFetch(`/api/positions/${id}`);
  const result = await response.json();
  return result.data;
};

export const getCompanyById = async (id: number): Promise<Company> => {
  const response = await optimizedFetch(`/api/companies/${id}`);
  const result = await response.json();
  return result.data;
};

export const getDepartmentById = async (id: number): Promise<Department> => {
  const response = await optimizedFetch(`/api/departments/${id}`);
  const result = await response.json();
  return result.data;
};

// Existing API functions used by other components
export const getPositions = async (): Promise<{ data?: Position[] }> => {
  const response = await fetch('/api/positions');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const getDepartments = async (companyId?: string, includePositions?: boolean, language?: string, raw?: boolean): Promise<Department[]> => {
  const params = new URLSearchParams();
  if (companyId && companyId !== 'all') params.append('companyId', companyId);
  if (includePositions) params.append('includePositions', 'true');
  if (language) params.append('language', language);
  if (raw) params.append('raw', 'true');
  
  const url = `/api/departments${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();
  return result.data || [];
};

export const getCompanies = async (): Promise<{ data?: Company[] }> => {
  const response = await fetch('/api/companies');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Admin CRUD functions  
export const createDepartment = async (department: any): Promise<Department> => {
  const response = await fetch('/api/departments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(department)
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();
  return result.data;
};

export const updateDepartment = async (id: number, department: any): Promise<Department> => {
  const response = await fetch(`/api/departments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(department)
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();
  return result.data;
};

export const deleteDepartment = async (id: number): Promise<void> => {
  const response = await fetch(`/api/departments/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};

export const createCompany = async (company: any): Promise<Company> => {
  const response = await fetch('/api/companies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(company)
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();
  return result.data;
};

export const updateCompany = async (id: number, company: any): Promise<Company> => {
  const response = await fetch(`/api/companies/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(company)
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();
  return result.data;
};

export const deleteCompany = async (id: number): Promise<void> => {
  const response = await fetch(`/api/companies/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};

export const createPosition = async (position: any): Promise<Position> => {
  const response = await fetch('/api/positions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(position)
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();
  return result.data;
};

export const updatePosition = async (id: number, position: any): Promise<Position> => {
  const response = await fetch(`/api/positions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(position)
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();
  return result.data;
};

export const deletePosition = async (id: number): Promise<void> => {
  const response = await fetch(`/api/positions/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};

// Generic API client methods
const get = async (endpoint: string) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const post = async (endpoint: string, data: any) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const put = async (endpoint: string, data: any) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const del = async (endpoint: string) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Default export for backward compatibility
const api = {
  get,
  post,
  put,
  delete: del,
  getPositions,
  getDepartments, 
  getCompanies,
  getPositionById,
  getCompanyById,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createCompany,
  updateCompany,
  deleteCompany,
  createPosition,
  updatePosition,
  deletePosition,
  API_BASE_URL
};

export default api;
export { api };