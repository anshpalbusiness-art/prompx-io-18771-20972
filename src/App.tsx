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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
