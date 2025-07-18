// API functions for JobPositionPage and other components
import { Position, Company, Department } from '@shared/schema';

// Export API base URL for other components  
export const API_BASE_URL = '/api';

// Individual entity fetchers for job position pages
export const getPositionById = async (id: number): Promise<Position> => {
  const response = await fetch(`/api/positions/${id}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();
  return result.data;
};

export const getCompanyById = async (id: number): Promise<Company> => {
  const response = await fetch(`/api/companies/${id}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();
  return result.data;
};

export const getDepartmentById = async (id: number): Promise<Department> => {
  const response = await fetch(`/api/departments/${id}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
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

export const getDepartments = async (): Promise<Department[]> => {
  const response = await fetch('/api/departments');
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

// Default export for backward compatibility
const api = {
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