import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import { UserProvider } from "../../context/UserContext";
import { DataProvider } from "../../context/DataContext";
import AppShell from "../ui/AppShell";

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. Still initializing (with fail-safe timeout in Context)
  if (loading && !user) {
    return <AppShell />;
  }

  // 2. Auth checked and no user found -> Force login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. User authenticated -> Render Dashboard Stack
  return (
    <UserProvider>
      <DataProvider>
        <DashboardLayout>
          <Outlet />
        </DashboardLayout>
      </DataProvider>
    </UserProvider>
  );
};

export default ProtectedRoute;