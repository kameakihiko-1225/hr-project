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
import AdminLogin from "./pages/admin/login/index";
import AdminDashboard from "./pages/admin/dashboard/index";
import AdminCompanies from "./pages/admin/companies/index";
import AdminDepartments from "./pages/admin/departments/index";
import AdminPositions from "./pages/admin/positions/index";
import AdminBlog from "./pages/AdminBlog";

// Import authentication
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";




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
      <AuthProvider>
        <ClickCounterProvider>
          <Toaster />
          <Sonner />
          <Router>
          <Switch>
            <Route path="/" component={Index} />
            <Route path="/blog" component={Blog} />
            <Route path="/positions/:id" component={JobPositionPage} />
            
            {/* Admin Login Route - Public */}
            <Route path="/admin/login" component={AdminLogin} />
            
            {/* Protected Admin Routes */}
            <Route path="/admin/dashboard">
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/companies">
              <ProtectedRoute>
                <AdminCompanies />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/departments">
              <ProtectedRoute>
                <AdminDepartments />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/positions">
              <ProtectedRoute>
                <AdminPositions />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/blog">
              <ProtectedRoute>
                <AdminBlog />
              </ProtectedRoute>
            </Route>

            
            {/* Catch-all route for 404 */}
            <Route component={NotFound} />
          </Switch>
          </Router>
        </ClickCounterProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
