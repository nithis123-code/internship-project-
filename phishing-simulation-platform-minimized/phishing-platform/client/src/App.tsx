import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import Templates from "./pages/Templates";
import Recipients from "./pages/Recipients";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import PublicTracking from "./pages/PublicTracking";
import PublicAwareness from "./pages/PublicAwareness";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/track/:token" component={PublicTracking} />
      <Route path="/awareness/:campaignId" component={PublicAwareness} />
      
      {/* Protected dashboard routes */}
      <Route path="/" component={() => (
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      )} />
      <Route path="/campaigns" component={() => (
        <DashboardLayout>
          <Campaigns />
        </DashboardLayout>
      )} />
      <Route path="/templates" component={() => (
        <DashboardLayout>
          <Templates />
        </DashboardLayout>
      )} />
      <Route path="/recipients" component={() => (
        <DashboardLayout>
          <Recipients />
        </DashboardLayout>
      )} />
      <Route path="/analytics" component={() => (
        <DashboardLayout>
          <Analytics />
        </DashboardLayout>
      )} />
      <Route path="/settings" component={() => (
        <DashboardLayout>
          <Settings />
        </DashboardLayout>
      )} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
