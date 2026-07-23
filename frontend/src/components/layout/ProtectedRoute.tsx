import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, token, user, fetchProfile } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // If we have a token but no user loaded, try fetching the profile
    if (token && !user && !isLoading && !isAuthenticated) {
      fetchProfile();
    }
  }, [token, user, isLoading, isAuthenticated, fetchProfile]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  // If there's no token in state (and not loading), they definitely aren't logged in
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If we have a token but it's checking, wait a bit
  if (!isAuthenticated && !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return <Outlet />;
}
