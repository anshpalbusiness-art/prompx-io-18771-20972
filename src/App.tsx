import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Benchmark from "./pages/Benchmark";
import Agents from "./pages/Agents";
import Team from "./pages/Team";
import Marketplace from "./pages/Marketplace";
import Settings from "./pages/Settings";
import Compliance from "./pages/Compliance";
import Community from "./pages/Community";
import Enterprise from "./pages/Enterprise";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import OptimizationLab from "./pages/OptimizationLab";
import Integrations from "./pages/Integrations";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import VisualBuilder from "./pages/VisualBuilder";
import AICopilotPage from "./pages/AICopilot";
import Templates from "./pages/Templates";
import History from "./pages/History";
import Workflow from "./pages/Workflow";
import LegalPacks from "./pages/LegalPacks";
import ApiKeys from "./pages/ApiKeys";
import Usage from "./pages/Usage";
import CompliancePage from "./pages/CompliancePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/visual-builder" element={<VisualBuilder />} />
            <Route path="/ai-copilot" element={<AICopilotPage />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/history" element={<History />} />
            <Route path="/workflow" element={<Workflow />} />
            <Route path="/legal-packs" element={<LegalPacks />} />
            <Route path="/api-keys" element={<ApiKeys />} />
            <Route path="/usage" element={<Usage />} />
            <Route path="/compliance-dashboard" element={<CompliancePage />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/benchmark" element={<Benchmark />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/optimization-lab" element={<OptimizationLab />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/team" element={<Team />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/community" element={<Community />} />
            <Route path="/enterprise" element={<Enterprise />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
