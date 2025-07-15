import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { AuthProvider } from "@/lib/authContext";
import { ClickCounterProvider } from "@/contexts/ClickCounterContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";


// Import admin pages
import AdminLogin from "./pages/admin/login";
import AdminDashboard from "./pages/admin/dashboard/index";
import AdminCompanies from "./pages/admin/companies/index";
import AdminDepartments from "./pages/admin/departments/index";
import AdminPositions from "./pages/admin/positions/index";
import AdminBlog from "./pages/AdminBlog";
import { AdminAnalytics } from "./pages/AdminAnalytics";



const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const [url] = queryKey;
        const response = await fetch(url as string, {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
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

// Helper function for auth headers
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

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
            
            {/* Admin Routes */}
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
            <Route path="/admin/analytics">
              <ProtectedRoute>
                <AdminAnalytics />
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
