import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import { UserProvider } from "../../context/UserContext";
import { DataProvider } from "../../context/DataContext";
import AppShell from "../ui/AppShell";

const ProtectedRoute: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  // Show a high-fidelity app skeleton ONLY when checking authentication state for protected routes.
  // This provides a smooth experience for logged-in users on refresh.
  if (authLoading) {
    return <AppShell />;
  }

  // If authentication is resolved and there is no user, redirect to login.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If a user exists, wrap the authenticated app in the necessary data providers.
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
