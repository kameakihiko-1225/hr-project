import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { AuthProvider } from "@/lib/authContext";
import { ClickCounterProvider } from "@/contexts/ClickCounterContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Gallery from "./pages/Gallery";
import NotFound from "./pages/NotFound";
import { EnvDebug } from "./components/EnvDebug";

// Import admin pages
import AdminLogin from "./pages/admin/login";
import AdminDashboard from "./pages/admin/dashboard/index";
import AdminCompanies from "./pages/admin/companies/index";
import AdminDepartments from "./pages/admin/departments/index";
import AdminPositions from "./pages/admin/positions/index";
import AdminGallery from "./pages/AdminGallery";



const queryClient = new QueryClient();

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
            <Route path="/gallery" component={Gallery} />
            
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
            <Route path="/admin/gallery">
              <ProtectedRoute>
                <AdminGallery />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/gallery">
              <ProtectedRoute>
                <AdminGallery />
              </ProtectedRoute>
            </Route>

            
            {/* Catch-all route for 404 */}
            <Route component={NotFound} />
          </Switch>
          </Router>
          
          {/* Debug component for environment variables */}
          <EnvDebug />
        </ClickCounterProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
