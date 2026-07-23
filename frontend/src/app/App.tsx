import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RootLayout } from "@/components/layout/RootLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import DashboardPage from "@/pages/DashboardPage";
import LoginPage from "@/pages/LoginPage";

const LiveTrafficRouterPage = lazy(() => import("@/pages/LiveTrafficRouterPage"));
const LiveTrafficSwitchPage = lazy(() => import("@/pages/LiveTrafficSwitchPage"));
const NetworkTopologyPage = lazy(() => import("@/pages/NetworkTopologyPage"));
const SlaOverviewPage = lazy(() => import("@/pages/SlaOverviewPage"));
const SlaDetailReportPage = lazy(() => import("@/pages/SlaDetailReportPage"));
const DeviceListPage = lazy(() => import("@/pages/DeviceListPage"));
const LiveEventsPage = lazy(() => import("@/pages/LiveEventsPage"));
const ResourceMonitorPage = lazy(() => import("@/pages/ResourceMonitorPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export function App() {
  useEffect(() => {
    // Theme initialization
    const theme = localStorage.getItem("theme");
    if (theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" /></div>}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<RootLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/traffic/router" element={<LiveTrafficRouterPage />} />
                <Route path="/traffic/switch" element={<LiveTrafficSwitchPage />} />
                <Route path="/topology" element={<NetworkTopologyPage />} />
                <Route path="/sla/overview" element={<SlaOverviewPage />} />
                <Route path="/sla/detail" element={<SlaDetailReportPage />} />
                <Route path="/devices" element={<DeviceListPage />} />
                <Route path="/events" element={<LiveEventsPage />} />
                <Route path="/resources" element={<ResourceMonitorPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
