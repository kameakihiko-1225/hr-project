import { createLogger } from './logger';

const logger = createLogger('mockApi');

// Use local placeholder instead of external service
const PLACEHOLDER_IMAGE = '/placeholder.svg';

/**
 * Mock API response for login
 */
export async function mockLoginResponse(email: string, password: string) {
  logger.info(`Mock login attempt for: ${email}`);
  
  // Simple validation - in a real app, this would check against a database
  if (email === 'admin@example.com' && password === 'password') {
    return {
      success: true,
      admin: {
        id: '1',
        email: 'admin@example.com',
        isSuperAdmin: true,
      },
      token: 'mock-jwt-token-for-testing-purposes-only',
    };
  }
  
  return {
    success: false,
    error: 'Invalid email or password',
  };
}

/**
 * Mock API response for getting companies
 */
export async function mockGetCompaniesResponse() {
  logger.info('Mock fetching companies');
  
  return {
    success: true,
    companies: [
      {
        id: "1",
        name: "Acme Corporation",
        email: "contact@acme.com",
        phone: "+1 (555) 123-4567",
        city: "New York",
        country: "USA",
        logoUrl: PLACEHOLDER_IMAGE,
        color: "#2563eb",
        description: "A global leader in innovative solutions for various industries. Specializing in cutting-edge technology and sustainable practices.",
      },
      {
        id: "2",
        name: "TechGiant Inc.",
        email: "info@techgiant.com",
        phone: "+1 (555) 987-6543",
        city: "San Francisco",
        country: "USA",
        logoUrl: PLACEHOLDER_IMAGE,
        color: "#16a34a",
        description: "Pioneering the future of technology with groundbreaking research and development in AI, cloud computing, and consumer electronics.",
      },
      {
        id: "3",
        name: "Global Solutions Ltd.",
        email: "hello@globalsolutions.com",
        phone: "+44 20 1234 5678",
        city: "London",
        country: "UK",
        logoUrl: PLACEHOLDER_IMAGE,
        color: "#dc2626",
        description: "Providing comprehensive business solutions to enterprises worldwide, with a focus on digital transformation and operational excellence.",
      },
    ],
  };
}

/**
 * Mock API response for creating a company
 */
export async function mockCreateCompanyResponse(companyData: any) {
  logger.info(`Mock creating company: ${companyData.name}`);
  
  // If no logo URL is provided, use the placeholder
  if (!companyData.logoUrl) {
    companyData.logoUrl = PLACEHOLDER_IMAGE;
  }
  
  return {
    success: true,
    company: {
      id: Date.now().toString(),
      ...companyData,
    },
  };
}

/**
 * Mock API response for updating a company
 */
export async function mockUpdateCompanyResponse(id: string, companyData: any) {
  logger.info(`Mock updating company: ${id}`);
  
  return {
    success: true,
    company: {
      id,
      ...companyData,
    },
  };
}

/**
 * Mock API response for deleting a company
 */
export async function mockDeleteCompanyResponse(id: string) {
  logger.info(`Mock deleting company: ${id}`);
  
  return {
    success: true,
    message: 'Company deleted successfully',
  };
}

/**
 * Setup mock API interceptor
 */
export function setupMockApi() {
  logger.info('Setting up mock API interceptor');
  
  // Store original fetch
  const originalFetch = window.fetch;
  
  // Override fetch to intercept API calls
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    const url = input instanceof Request ? input.url : input.toString();
    const method = input instanceof Request ? input.method : init?.method || 'GET';
    
    // Only intercept API calls
    if (!url.includes('/api/')) {
      return originalFetch(input, init);
    }
    
    logger.debug(`Intercepting ${method} ${url}`);
    
    try {
      // Process the request based on the URL
      if (url.includes('/api/auth/login') && method === 'POST') {
        const body = input instanceof Request 
          ? await input.json() 
          : init?.body ? JSON.parse(init.body as string) : {};
        
        const response = await mockLoginResponse(body.email, body.password);
        
        return new Response(JSON.stringify(response), {
          status: response.success ? 200 : 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      if (url.includes('/api/companies') && !url.includes('/api/companies/') && method === 'GET') {
        const response = await mockGetCompaniesResponse();
        
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      if (url.includes('/api/companies') && !url.includes('/api/companies/') && method === 'POST') {
        const body = input instanceof Request 
          ? await input.json() 
          : init?.body ? JSON.parse(init.body as string) : {};
        
        const response = await mockCreateCompanyResponse(body);
        
        return new Response(JSON.stringify(response), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Handle company operations with ID
      const companyIdMatch = url.match(/\/api\/companies\/([^\/]+)/);
      if (companyIdMatch) {
        const companyId = companyIdMatch[1];
        
        if (method === 'PUT') {
          const body = input instanceof Request 
            ? await input.json() 
            : init?.body ? JSON.parse(init.body as string) : {};
          
          const response = await mockUpdateCompanyResponse(companyId, body);
          
          return new Response(JSON.stringify(response), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        
        if (method === 'DELETE') {
          const response = await mockDeleteCompanyResponse(companyId);
          
          return new Response(JSON.stringify(response), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
      
      // Default response for unhandled API routes
      logger.warn(`Unhandled mock API route: ${method} ${url}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Not implemented in mock API' 
      }), {
        status: 501,
        headers: { 'Content-Type': 'application/json' },
      });
      
    } catch (error) {
      logger.error('Error in mock API handler', error);
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Mock API error' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
  
  logger.info('Mock API interceptor set up successfully');
} 