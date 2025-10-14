import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ApplicationTracker from "./pages/ApplicationTracker";
import ResumeBuilder from "./pages/ResumeBuilder";
import Agent from "./pages/Agent";
import MailAgent from "./pages/MailAgent";
import CalendarPage from "./pages/CalendarPage";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route element={<MainLayout />}>
            <Route index element={<ApplicationTracker />} />
            <Route path="resume" element={<ResumeBuilder />} />
            <Route path="agent" element={<Agent />} />
            <Route path="mail-agent" element={<MailAgent />} />
            <Route path="calendar" element={<CalendarPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
