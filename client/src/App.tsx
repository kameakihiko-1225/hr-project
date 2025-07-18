import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { ClickCounterProvider } from "@/contexts/ClickCounterContext";
import Index from "./pages/Index";
import Blog from "./pages/Blog";
import JobPositionPage from "./pages/JobPositionPage";
import NotFound from "./pages/NotFound";

// Import admin pages
import AdminDashboard from "./pages/admin/dashboard/index";
import AdminCompanies from "./pages/admin/companies/index";
import AdminDepartments from "./pages/admin/departments/index";
import AdminPositions from "./pages/admin/positions/index";
import AdminBlog from "./pages/AdminBlog";




const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const [url, params] = queryKey;
        let apiUrl = url as string;
        
        // Add language parameter if not already present
        const urlObj = new URL(apiUrl, window.location.origin);
        if (!urlObj.searchParams.has('language')) {
          const currentLanguage = localStorage.getItem('i18nextLng') || 'en';
          urlObj.searchParams.set('language', currentLanguage);
        }
        
        // Add additional params if provided
        if (params && typeof params === 'object') {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              urlObj.searchParams.set(key, String(value));
            }
          });
        }
        
        const response = await fetch(urlObj.toString(), {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      },
    },
  },
});



const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ClickCounterProvider>
        <Toaster />
        <Sonner />
        <Router>
        <Switch>
          <Route path="/" component={Index} />
          <Route path="/blog" component={Blog} />
          <Route path="/positions/:id" component={JobPositionPage} />
          
          {/* Admin Routes - No authentication required */}
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/companies" component={AdminCompanies} />
          <Route path="/admin/departments" component={AdminDepartments} />
          <Route path="/admin/positions" component={AdminPositions} />
          <Route path="/admin/blog" component={AdminBlog} />

          
          {/* Catch-all route for 404 */}
          <Route component={NotFound} />
        </Switch>
        </Router>
      </ClickCounterProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
