import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router, Route, Switch } from "wouter";
import { AuthProvider } from "@/lib/authContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { EnvDebug } from "./components/EnvDebug";

// Import admin pages
import AdminLogin from "./pages/admin/login";
import AdminDashboard from "./pages/admin/dashboard/index";
import AdminCompanies from "./pages/admin/companies/index";
import AdminDepartments from "./pages/admin/departments/index";
import AdminPositions from "./pages/admin/positions/index";
import AdminBots from "./pages/admin/bots/index";
import AdminCandidates from "./pages/admin/bots/candidates";
import CandidateDetail from "./pages/admin/bots/candidate-detail";
import AdminSMS from "./pages/admin/sms/index";
import CampaignDetail from "./pages/admin/sms/campaign-detail";
import AiTrainerPage from "./pages/admin/ai-trainer/index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Switch>
            <Route path="/" component={Index} />
            
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
            <Route path="/admin/ai-trainer">
              <ProtectedRoute>
                <AiTrainerPage />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/bots">
              <ProtectedRoute>
                <AdminBots />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/bots/candidates">
              <ProtectedRoute>
                <AdminCandidates />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/bots/candidate-detail/:id">
              <ProtectedRoute>
                <CandidateDetail />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/sms">
              <ProtectedRoute>
                <AdminSMS />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/sms/campaign-detail/:id">
              <ProtectedRoute>
                <CampaignDetail />
              </ProtectedRoute>
            </Route>
            <Route path="/admin/sms/:id">
              <ProtectedRoute>
                <CampaignDetail />
              </ProtectedRoute>
            </Route>
            
            {/* Catch-all route for 404 */}
            <Route component={NotFound} />
          </Switch>
        </Router>
        
        {/* Debug component for environment variables */}
        <EnvDebug />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
