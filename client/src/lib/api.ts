import { createLogger } from './logger';
import { env } from './env';

// Create a logger for the API client
const logger = createLogger('apiClient');

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// API base URL
export const API_BASE_URL = env.apiUrl || 'http://localhost:3000/api';

// Get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  admin?: any; // For auth responses
  token?: string; // For auth responses
  message?: string; // For success messages
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Fetch options interface
export interface FetchOptions {
  headers?: Record<string, string>;
  timeout?: number;
  useMockData?: boolean; // Whether to use mock data if available
}

// Interface definitions for API modules


export interface CompaniesApi {
  getAll: () => Promise<ApiResponse>;
  getById: (id: string) => Promise<any>;
  create: (companyData: FormData) => Promise<any>;
  update: (id: string, companyData: FormData) => Promise<any>;
  delete: (id: string) => Promise<any>;
}

export interface DepartmentsApi {
  getAll: (companyId?: string) => Promise<any[]>;
  getById: (id: string) => Promise<any>;
  getByCompany: (companyId: string) => Promise<any[]>;
  create: (departmentData: { name: string; description?: string; companyId: string }) => Promise<any>;
  update: (id: string, departmentData: { name?: string; description?: string }) => Promise<any>;
  delete: (id: string) => Promise<any>;
}

export interface PositionsApi {
  getAll: (departmentId?: string) => Promise<any[]>;
  getById: (id: string) => Promise<any>;
  getByDepartment: (departmentId: string) => Promise<any[]>;
  create: (positionData: { title: string; description?: string; salaryRange?: string; employmentType?: string; departmentId: string }) => Promise<any>;
  update: (id: string, positionData: { title?: string; description?: string; salaryRange?: string; employmentType?: string }) => Promise<any>;
  delete: (id: string) => Promise<any>;
}

// Mock data for browser environment
const mockData: Record<string, any> = {
  '/companies': {
    success: true,
    data: [
      {
        id: 'mock-company-1',
        name: 'Mock Company 1',
        description: 'A mock company for testing',
        logoUrl: null,
        adminId: 'mock-admin-id',
        createdAt: new Date().toISOString(),
        address: '123 Mock St',
        city: 'Mock City',
        country: 'Mockland',
        phone: '+1-555-MOCK',
        email: 'info@mockcompany.com',
        color: '#FF5733',
        industries: [
          { id: "tag-1", name: "Technology" },
          { id: "tag-4", name: "Education" }
        ],
        jobs: [
          {
            id: 'mock-job-1',
            title: 'Mock Developer',
            description: 'A mock job for testing',
            location: 'Mock City, Mockland',
            salary: '$100,000 - $150,000',
            type: 'Full-time',
            companyId: 'mock-company-1',
            postedAt: new Date().toISOString(),
          }
        ]
      },
      {
        id: 'mock-company-2',
        name: 'Mock Company 2',
        description: 'Another mock company',
        logoUrl: null,
        adminId: 'mock-admin-id',
        createdAt: new Date().toISOString(),
        address: '456 Test Ave',
        city: 'Test City',
        country: 'Testland',
        phone: '+1-555-TEST',
        email: 'info@testcompany.com',
        color: '#33FF57',
        industries: [
          { id: "tag-3", name: "Finance" },
          { id: "tag-6", name: "Retail" }
        ],
        jobs: [
          {
            id: 'mock-job-2',
            title: 'Mock Designer',
            description: 'Another mock job',
            location: 'Test City, Testland',
            salary: '$80,000 - $120,000',
            type: 'Full-time',
            companyId: 'mock-company-2',
            postedAt: new Date().toISOString(),
          }
        ]
      }
    ]
  },
  // Mock response for specific company endpoints
  '/companies/mock-company-1': {
    success: true,
    data: {
      id: 'mock-company-1',
      name: 'Mock Company 1',
      description: 'A mock company for testing',
      logoUrl: null,
      adminId: 'mock-admin-id',
      createdAt: new Date().toISOString(),
      address: '123 Mock St',
      city: 'Mock City',
      country: 'Mockland',
      phone: '+1-555-MOCK',
      email: 'info@mockcompany.com',
      color: '#FF5733',
      jobs: []
    }
  },
  '/companies/mock-company-2': {
    success: true,
    data: {
      id: 'mock-company-2',
      name: 'Mock Company 2',
      description: 'Another mock company',
      logoUrl: null,
      adminId: 'mock-admin-id',
      createdAt: new Date().toISOString(),
      address: '456 Test Ave',
      city: 'Test City',
      country: 'Testland',
      phone: '+1-555-TEST',
      email: 'info@testcompany.com',
      color: '#33FF57',
      jobs: []
    }
  },
  '/api/companies': {
    success: true,
    data: [
      {
        id: 'mock-company-1',
        name: 'Mock Company 1',
        description: 'A mock company for testing',
        logoUrl: null,
        adminId: 'mock-admin-id',
        createdAt: new Date().toISOString(),
        address: '123 Mock St',
        city: 'Mock City',
        country: 'Mockland',
        phone: '+1-555-MOCK',
        email: 'info@mockcompany.com',
        color: '#FF5733',
        industries: [
          { id: "tag-1", name: "Technology" },
          { id: "tag-4", name: "Education" }
        ],
        jobs: [
          {
            id: 'mock-job-1',
            title: 'Mock Developer',
            description: 'A mock job for testing',
            location: 'Mock City, Mockland',
            salary: '$100,000 - $150,000',
            type: 'Full-time',
            companyId: 'mock-company-1',
            postedAt: new Date().toISOString(),
          }
        ]
      },
      {
        id: 'mock-company-2',
        name: 'Mock Company 2',
        description: 'Another mock company',
        logoUrl: null,
        adminId: 'mock-admin-id',
        createdAt: new Date().toISOString(),
        address: '456 Test Ave',
        city: 'Test City',
        country: 'Testland',
        phone: '+1-555-TEST',
        email: 'info@testcompany.com',
        color: '#33FF57',
        industries: [
          { id: "tag-3", name: "Finance" },
          { id: "tag-6", name: "Retail" }
        ],
        jobs: [
          {
            id: 'mock-job-2',
            title: 'Mock Designer',
            description: 'Another mock job',
            location: 'Test City, Testland',
            salary: '$80,000 - $120,000',
            type: 'Full-time',
            companyId: 'mock-company-2',
            postedAt: new Date().toISOString(),
          }
        ]
      }
    ]
  },
  // Mock response for specific company endpoints with API prefix
  '/api/companies/mock-company-1': {
    success: true,
    data: {
      id: 'mock-company-1',
      name: 'Mock Company 1',
      description: 'A mock company for testing',
      logoUrl: null,
      adminId: 'mock-admin-id',
      createdAt: new Date().toISOString(),
      address: '123 Mock St',
      city: 'Mock City',
      country: 'Mockland',
      phone: '+1-555-MOCK',
      email: 'info@mockcompany.com',
      color: '#FF5733',
      jobs: []
    }
  },
  '/api/companies/mock-company-2': {
    success: true,
    data: {
      id: 'mock-company-2',
      name: 'Mock Company 2',
      description: 'Another mock company',
      logoUrl: null,
      adminId: 'mock-admin-id',
      createdAt: new Date().toISOString(),
      address: '456 Test Ave',
      city: 'Test City',
      country: 'Testland',
      phone: '+1-555-TEST',
      email: 'info@testcompany.com',
      color: '#33FF57',
      jobs: []
    }
  },
  '/dashboard/stats': {
    success: true,
    data: {
      companies: 2,
      jobs: 2,
      applications: 0,
      admins: 1,
      recentActivity: [
        { id: 1, type: 'company', action: 'created', name: 'Mock Company 1', date: new Date().toISOString() },
        { id: 2, type: 'job', action: 'updated', name: 'Mock Developer', date: new Date().toISOString() }
      ]
    }
  },
  '/api/dashboard/stats': {
    success: true,
    data: {
      companies: 2,
      jobs: 2,
      applications: 0,
      admins: 1,
      recentActivity: [
        { id: 1, type: 'company', action: 'created', name: 'Mock Company 1', date: new Date().toISOString() },
        { id: 2, type: 'job', action: 'updated', name: 'Mock Developer', date: new Date().toISOString() }
      ]
    }
  },
  '/db/stats': {
    success: true,
    data: {
      tables: [
        { table_name: 'companies', row_count: 2, size_bytes: 102400, last_updated: new Date().toISOString() },
        { table_name: 'jobs', row_count: 2, size_bytes: 51200, last_updated: new Date().toISOString() },
        { table_name: 'admins', row_count: 1, size_bytes: 20480, last_updated: new Date().toISOString() },
        { table_name: 'departments', row_count: 0, size_bytes: 15360, last_updated: new Date().toISOString() }
      ],
      totalTables: 4,
      totalRows: 5,
      totalSize: 189440,
      lastUpdated: new Date().toISOString(),
      databaseSize: '185 KB',
      connectionStatus: 'Connected'
    }
  },
  '/api/db/stats': {
    success: true,
    data: {
      tables: [
        { table_name: 'companies', row_count: 2, size_bytes: 102400, last_updated: new Date().toISOString() },
        { table_name: 'jobs', row_count: 2, size_bytes: 51200, last_updated: new Date().toISOString() },
        { table_name: 'admins', row_count: 1, size_bytes: 20480, last_updated: new Date().toISOString() },
        { table_name: 'departments', row_count: 0, size_bytes: 15360, last_updated: new Date().toISOString() }
      ],
      totalTables: 4,
      totalRows: 5,
      totalSize: 189440,
      lastUpdated: new Date().toISOString(),
      databaseSize: '185 KB',
      connectionStatus: 'Connected'
    }
  },
  '/api/files': {
    success: true,
    data: {
      fileId: 'mock-file-id',
      fileName: 'mock-image.jpg',
      fileUrl: '/placeholder.svg',
      fileSize: 12345
    }
  },
  '/files': {
    success: true,
    data: {
      fileId: 'mock-file-id',
      fileName: 'mock-image.jpg',
      fileUrl: '/placeholder.svg',
      fileSize: 12345
    }
  },
  // Mock data for industry tags
  '/industry-tags': {
    success: true,
    data: [
      { id: "tag-1", name: "Technology" },
      { id: "tag-2", name: "Healthcare" },
      { id: "tag-3", name: "Finance" },
      { id: "tag-4", name: "Education" },
      { id: "tag-5", name: "Manufacturing" },
      { id: "tag-6", name: "Retail" },
      { id: "tag-7", name: "Hospitality" },
      { id: "tag-8", name: "Transportation" },
      { id: "tag-9", name: "Energy" },
      { id: "tag-10", name: "Media" }
    ]
  },
  '/api/industry-tags': {
    success: true,
    data: [
      { id: "tag-1", name: "Technology" },
      { id: "tag-2", name: "Healthcare" },
      { id: "tag-3", name: "Finance" },
      { id: "tag-4", name: "Education" },
      { id: "tag-5", name: "Manufacturing" },
      { id: "tag-6", name: "Retail" },
      { id: "tag-7", name: "Hospitality" },
      { id: "tag-8", name: "Transportation" },
      { id: "tag-9", name: "Energy" },
      { id: "tag-10", name: "Media" }
    ]
  }
};

/**
 * API Client
 * Provides methods for making API requests
 */
interface ApiClient {
  get<T = any>(endpoint: string, options?: FetchOptions): Promise<ApiResponse<T>>;
  post<T = any>(endpoint: string, data: any, options?: FetchOptions): Promise<ApiResponse<T>>;
  put<T = any>(endpoint: string, data: any, options?: FetchOptions): Promise<ApiResponse<T>>;
  patch<T = any>(endpoint: string, data: any, options?: FetchOptions): Promise<ApiResponse<T>>;
  delete<T = any>(endpoint: string, options?: FetchOptions): Promise<ApiResponse<T>>;
  uploadFile<T = any>(endpoint: string, file: File, additionalData?: Record<string, string>, options?: FetchOptions): Promise<ApiResponse<T>>;
  setToken(token: string): void;
  clearToken(): void;
  
  // Add API modules
  sms: SmsApi;
  companies: CompaniesApi;
  departments: DepartmentsApi;
  positions: PositionsApi;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.token = token;
    logger.debug('API token set');
  }
  
  /**
   * Clear authentication token
   */
  clearToken(): void {
    this.token = null;
    logger.debug('API token cleared');
  }
  
  /**
   * Get default headers
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add authorization header if token is available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }
  
  /**
   * Make a request to the API
   */
  private async request<T = any>(
    method: string,
    endpoint: string,
    data?: any,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      // Merge default headers with custom headers
      const headers = {
        ...this.getHeaders(),
        ...options.headers,
      };
      
      // Create request options
      const requestOptions: RequestInit = {
        method,
        headers,
      };
      
      // Add body for non-GET requests
      if (method !== 'GET' && data) {
        requestOptions.body = JSON.stringify(data);
      }
      
      logger.debug(`${method} ${url}`);
      
      // Make the request
      const response = await fetch(url, requestOptions);
      
      // Parse response
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      // Handle JSON response
      if (isJson) {
        const responseData = await response.json();
        
        if (response.ok) {
          return responseData;
        } else {
          logger.warn(`API error: ${responseData.error || response.statusText}`);
          
          // Check if we should use mock data
          if (isBrowser && !endpoint.includes("/auth/") && (response.status === 404 || response.status === 401 || options.useMockData)) {
            const mockResponse = this.getMockResponse(endpoint);
            if (mockResponse) {
              logger.info(`Using mock data for ${endpoint}`);
              return mockResponse;
            }
          }
          
          return {
            success: false,
            error: responseData.error || response.statusText,
          };
        }
      }
      
      // Handle non-JSON response
      if (response.ok) {
        return {
          success: true,
        };
      } else {
        logger.warn(`API error: ${response.statusText}`);
        
        // Check if we should use mock data
        if (isBrowser && !endpoint.includes("/auth/") && (response.status === 404 || response.status === 401 || options.useMockData)) {
          const mockResponse = this.getMockResponse(endpoint);
          if (mockResponse) {
            logger.info(`Using mock data for ${endpoint}`);
            return mockResponse;
          }
        }
        
        return {
          success: false,
          error: response.statusText,
        };
      }
    } catch (error) {
      logger.error(`API request error: ${error}`);
      
      // Use mock data in case of network error in browser
      if (isBrowser) {
        const mockResponse = this.getMockResponse(endpoint);
        if (mockResponse) {
          logger.info(`Using mock data for ${endpoint} after network error`);
          return mockResponse;
        }
      }
      
      return {
        success: false,
        error: 'Network error',
      };
    }
  }
  
  /**
   * Get mock response for an endpoint
   */
  private getMockResponse(endpoint: string): ApiResponse | null {
    // Try exact match first
    if (mockData[endpoint]) {
      return mockData[endpoint];
    }
    
    // Try to find a matching endpoint
    for (const key in mockData) {
      if (endpoint.endsWith(key)) {
        return mockData[key];
      }
    }
    
    // Handle dynamic endpoints with IDs
    // For company endpoints like /companies/123 or /api/companies/123
    if (endpoint.match(/\/companies\/[a-zA-Z0-9-]+$/) || endpoint.match(/\/api\/companies\/[a-zA-Z0-9-]+$/)) {
      const companyId = endpoint.split('/').pop();
      
      // Check if we have a mock for this specific company ID
      const specificEndpoint = endpoint.includes('/api/') 
        ? `/api/companies/${companyId}`
        : `/companies/${companyId}`;
        
      if (mockData[specificEndpoint]) {
        return mockData[specificEndpoint];
      }
      
      // If not, return a generic mock response
      logger.debug(`Creating dynamic mock response for company ID: ${companyId}`);
      
      return {
        success: true,
        data: {
          id: companyId,
          name: `Company ${companyId}`,
          description: 'A dynamically generated mock company',
          logoUrl: null,
          adminId: 'mock-admin-id',
          createdAt: new Date().toISOString(),
          city: 'Mock City',
          country: 'Mockland',
          phone: '+1-555-MOCK',
          email: `info@company${companyId}.com`,
          color: '#3b82f6'
        }
      };
    }
    
    // For PUT requests to company endpoints
    if (endpoint.match(/\/companies\/[a-zA-Z0-9-]+$/) || endpoint.match(/\/api\/companies\/[a-zA-Z0-9-]+$/)) {
      return {
        success: true,
        message: 'Company updated successfully'
      };
    }
    
    return null;
  }
  
  /**
   * Make a GET request to the API
   */
  async get<T = any>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, options);
  }
  
  /**
   * Make a POST request to the API
   */
  async post<T = any>(endpoint: string, data: any, options: FetchOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, data, options);
  }
  
  /**
   * Make a PUT request to the API
   */
  async put<T = any>(endpoint: string, data: any, options: FetchOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, data, options);
  }
  
  /**
   * Make a PATCH request to the API
   */
  async patch<T = any>(endpoint: string, data: any, options: FetchOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, options);
  }
  
  /**
   * Make a DELETE request to the API
   */
  async delete<T = any>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }
  
  /**
   * Upload a file to the API
   */
  async uploadFile<T = any>(
    endpoint: string, 
    file: File, 
    additionalData: Record<string, string> = {},
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Add additional data
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      // Get headers without content-type (browser will set it with boundary)
      const headers: Record<string, string> = {};
      
      // Add authorization header if token is available
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
      
      // Merge with custom headers
      const requestHeaders = {
        ...headers,
        ...options.headers,
      };
      
      logger.debug(`POST (file upload) ${url}`);
      
      // Make the request
      const response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body: formData,
      });
      
      // Parse response
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      // Handle JSON response
      if (isJson) {
        const responseData = await response.json();
        
        if (response.ok) {
          return responseData;
        } else {
          logger.warn(`API error: ${responseData.error || response.statusText}`);
          
          // Check if we should use mock data
          if (isBrowser && (response.status === 404 || response.status === 401 || options.useMockData)) {
            const mockResponse = this.getMockResponse(endpoint);
            if (mockResponse) {
              logger.info(`Using mock data for ${endpoint}`);
              return mockResponse;
            }
          }
          
          return {
            success: false,
            error: responseData.error || response.statusText,
          };
        }
      }
      
      // Handle non-JSON response
      if (response.ok) {
        return {
          success: true,
        };
      } else {
        logger.warn(`API error: ${response.statusText}`);
        
        // Check if we should use mock data
        if (isBrowser && (response.status === 404 || response.status === 401 || options.useMockData)) {
          const mockResponse = this.getMockResponse(endpoint);
          if (mockResponse) {
            logger.info(`Using mock data for ${endpoint}`);
            return mockResponse;
          }
        }
        
        return {
          success: false,
          error: response.statusText,
        };
      }
    } catch (error) {
      logger.error(`File upload error: ${error}`);
      
      // Use mock data in case of network error in browser
      if (isBrowser) {
        const mockResponse = this.getMockResponse(endpoint);
        if (mockResponse) {
          logger.info(`Using mock data for ${endpoint} after network error`);
          return mockResponse;
        }
      }
      
      return {
        success: false,
        error: 'Network error during file upload',
      };
    }
  }
  
  // Declare properties for API modules
  companies: CompaniesApi;
  departments: DepartmentsApi;
  positions: PositionsApi;
}


// Legacy exports for backward compatibility
export const getCompanies = async () => {
  const response = await fetch(`${API_BASE_URL}/companies`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch companies');
  return await response.json();
};

export const getDepartments = async (companyId?: string) => {
  const url = companyId ? `${API_BASE_URL}/departments?companyId=${companyId}` : `${API_BASE_URL}/departments`;
  const response = await fetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch departments');
  const data = await response.json();
  return data.data || [];
};

export const getPositions = async (departmentId?: string) => {
  const url = departmentId ? `${API_BASE_URL}/positions?departmentId=${departmentId}` : `${API_BASE_URL}/positions`;
  const response = await fetch(url, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch positions');
  const data = await response.json();
  return data.data || [];
};

export const getDepartment = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch department');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching department:', error);
    throw error;
  }
};

export const createDepartment = async (departmentData: { name: string; description?: string; companyId: string }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/departments`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(departmentData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create department');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error creating department:', error);
    throw error;
  }
};

export const updateDepartment = async (id: string, departmentData: { name?: string; description?: string }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(departmentData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update department');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error updating department:', error);
    throw error;
  }
};

export const deleteDepartment = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete department');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting department:', error);
    throw error;
  }
};



export const getPosition = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/positions/${id}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch position');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching position:', error);
    throw error;
  }
};

export const createPosition = async (positionData: { 
  title: string; 
  description?: string; 
  salaryRange?: string; 
  employmentType?: string; 
  departmentId: string 
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/positions`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(positionData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create position');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error creating position:', error);
    throw error;
  }
};

export const updatePosition = async (id: string, positionData: Record<string, any>) => {
  try {
    const response = await fetch(`${API_BASE_URL}/positions/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(positionData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update position');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error updating position:', error);
    throw error;
  }
};

export const deletePosition = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/positions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete position');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting position:', error);
    throw error;
  }
};



export const getCompany = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch company');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching company:', error);
    throw error;
  }
};

export const createCompany = async (companyData: FormData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/companies`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: companyData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create company');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
};

export const updateCompany = async (id: string, companyData: FormData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: companyData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update company');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error updating company:', error);
    throw error;
  }
};

export const deleteCompany = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete company');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting company:', error);
    throw error;
  }
};


export const getBotById = async (botId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bots/${botId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch bot');
    return await response.json();
  } catch (error) {
    console.error('Error fetching bot by ID:', error);
    throw error;
  }
};

export const getBotByAdminId = async (adminId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bots/admin/${adminId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch bot');
    return await response.json();
  } catch (error) {
    console.error('Error fetching bot by admin ID:', error);
    throw error;
  }
};

export const updateBot = async (id: string, data: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bots/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update bot');
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to update bot');
    }
    return result.data;
  } catch (error) {
    console.error('Error updating bot:', error);
    throw error;
  }
};

export const deleteBot = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bots/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete bot');
    return await response.json();
  } catch (error) {
    console.error('Error deleting bot:', error);
    throw error;
  }
};

export const setWebhook = async (botId: string, webhookUrl: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bots/${botId}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ webhookUrl })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to set webhook');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error setting webhook:', error);
    throw error;
  }
};

export const removeWebhook = async (botId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bots/${botId}/webhook`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to remove webhook');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error removing webhook:', error);
    throw error;
  }
};

export const getBotPositions = async (botId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bots/${botId}/positions`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get bot positions');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error getting bot positions:', error);
    throw error;
  }
};

export const getBotStatistics = async (botId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bots/${botId}/statistics`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get bot statistics');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error getting bot statistics:', error);
    throw error;
  }
};

export const getCandidates = async () => {
  try {
    logger.debug('Fetching all candidates');
    
    // For now, return mock data
    return {
      success: true,
      data: []
    };
  } catch (error) {
    logger.error('Error fetching candidates:', error);
    return {
      success: false,
      error: 'Failed to fetch candidates'
    };
  }
};

export const getCandidatesByBotId = async (botId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bots/${botId}/candidates`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch candidates');
    return await response.json();
  } catch (error) {
    console.error('Error fetching candidates by bot ID:', error);
    throw error;
  }
};

export const getCandidateById = async (candidateId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch candidate');
    return await response.json();
  } catch (error) {
    console.error('Error fetching candidate by ID:', error);
    throw error;
  }
};

// ----------------- Deep-link helper -----------------
// Creates a pre-registered candidate and returns a Telegram deep-link so the user can start
// chatting with the AI recruiter immediately.
export const createCandidateDeepLink = async (
  botId: string,
  positionId: string,
  fullName?: string
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/bots/${botId}/deeplink`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ positionId, fullName })
    });
    if (!response.ok) throw new Error('Failed to create deep link');
    return await response.json();
  } catch (error) {
    console.error('Error creating candidate deep link:', error);
    throw error;
  }
};





// Entity Validation API
export interface EntityValidationApi {
  validateEntity: (type: string, id: string) => Promise<ApiResponse>;
  updateEntityFields: (type: string, id: string, updateData: any) => Promise<ApiResponse>;
  validateCampaignEntities: (campaignData: any) => Promise<ApiResponse>;
  getRequiredFieldsConfig: (type: string) => Promise<ApiResponse>;
}

// Entity validation functions
export const validateEntity = async (type: string, id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/validation/entity/${type}/${id}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to validate entity');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error validating entity:', error);
    throw error;
  }
};

export const updateEntityFields = async (type: string, id: string, updateData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/validation/entity/${type}/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update entity fields');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating entity fields:', error);
    throw error;
  }
};

export const validateCampaignEntities = async (campaignData: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/validation/campaign-entities`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(campaignData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to validate campaign entities');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error validating campaign entities:', error);
    throw error;
  }
};

export const getRequiredFieldsConfig = async (type: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/validation/required-fields/${type}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get required fields config');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting required fields config:', error);
    throw error;
  }
};

// Companies API implementation
const companies: CompaniesApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/companies`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch companies');
    return await response.json();
  },
  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch company');
    return await response.json();
  },
  create: async (companyData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/companies`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: companyData
    });
    if (!response.ok) throw new Error('Failed to create company');
    return await response.json();
  },
  update: async (id: string, companyData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: companyData
    });
    if (!response.ok) throw new Error('Failed to update company');
    return await response.json();
  },
  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete company');
    return await response.json();
  }
};

// Departments API implementation
const departments: DepartmentsApi = {
  getAll: async (companyId?: string) => {
    const url = companyId ? `${API_BASE_URL}/departments?companyId=${companyId}` : `${API_BASE_URL}/departments`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch departments');
    const data = await response.json();
    return data.data || [];
  },
  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch department');
    return await response.json();
  },
  getByCompany: async (companyId: string) => {
    const response = await fetch(`${API_BASE_URL}/departments?companyId=${companyId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch departments');
    const data = await response.json();
    return data.data || [];
  },
  create: async (departmentData) => {
    const response = await fetch(`${API_BASE_URL}/departments`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(departmentData)
    });
    if (!response.ok) throw new Error('Failed to create department');
    return await response.json();
  },
  update: async (id: string, departmentData) => {
    const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(departmentData)
    });
    if (!response.ok) throw new Error('Failed to update department');
    return await response.json();
  },
  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete department');
    return await response.json();
  }
};

// Positions API implementation
const positions: PositionsApi = {
  getAll: async (departmentId?: string) => {
    const url = departmentId ? `${API_BASE_URL}/positions?departmentId=${departmentId}` : `${API_BASE_URL}/positions`;
    const response = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch positions');
    const data = await response.json();
    return data.data || [];
  },
  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/positions/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch position');
    return await response.json();
  },
  getByDepartment: async (departmentId: string) => {
    const response = await fetch(`${API_BASE_URL}/positions?departmentId=${departmentId}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch positions');
    const data = await response.json();
    return data.data || [];
  },
  create: async (positionData) => {
    const response = await fetch(`${API_BASE_URL}/positions`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(positionData)
    });
    if (!response.ok) throw new Error('Failed to create position');
    return await response.json();
  },
  update: async (id: string, positionData) => {
    const response = await fetch(`${API_BASE_URL}/positions/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(positionData)
    });
    if (!response.ok) throw new Error('Failed to update position');
    return await response.json();
  },
  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/positions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete position');
    return await response.json();
  }
};

// Create and export API client instance
const api = new ApiClient(API_BASE_URL);

// Add API modules to the client
api.companies = companies;
api.departments = departments;
api.positions = positions;

export default api;

// ----------------- Training / Documents -----------------

export const getDocumentsForPosition = async (positionId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/positions/${positionId}/documents`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch documents');
    return await response.json();
  } catch (error) {
    console.error('Error fetching documents for position:', error);
    throw error;
  }
};

export const createPositionDeepLink = async (positionId: string, fullName?: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/positions/${positionId}/deeplink`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fullName })
    });
    if (!response.ok) throw new Error('Failed to create deep link');
    return await response.json();
  } catch (error) {
    console.error('Error creating position deep link:', error);
    throw error;
  }
}; 