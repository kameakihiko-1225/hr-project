import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* Protected Admin Routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/companies" element={
              <ProtectedRoute>
                <AdminCompanies />
              </ProtectedRoute>
            } />
            <Route path="/admin/departments" element={
              <ProtectedRoute>
                <AdminDepartments />
              </ProtectedRoute>
            } />
            <Route path="/admin/positions" element={
              <ProtectedRoute>
                <AdminPositions />
              </ProtectedRoute>
            } />
            <Route path="/admin/ai-trainer" element={
              <ProtectedRoute>
                <AiTrainerPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/bots" element={
              <ProtectedRoute>
                <AdminBots />
              </ProtectedRoute>
            } />
            <Route path="/admin/bots/candidates" element={
              <ProtectedRoute>
                <AdminCandidates />
              </ProtectedRoute>
            } />
            <Route path="/admin/bots/candidate-detail/:id" element={
              <ProtectedRoute>
                <CandidateDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/sms" element={
              <ProtectedRoute>
                <AdminSMS />
              </ProtectedRoute>
            } />
            <Route path="/admin/sms/campaign-detail/:id" element={
              <ProtectedRoute>
                <CampaignDetail />
              </ProtectedRoute>
            } />
            <Route path="/admin/sms/:id" element={
              <ProtectedRoute>
                <CampaignDetail />
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          {/* Debug component for environment variables */}
          <EnvDebug />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
