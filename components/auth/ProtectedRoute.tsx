import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import { UserProvider } from "../../context/UserContext";
import { DataProvider } from "../../context/DataContext";
import AppShell from "../ui/AppShell";

const ProtectedRoute: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  // Show a high-fidelity app skeleton while loading
  if (authLoading) {
    return <AppShell />;
  }

  // Redirect to login if no user is found
  if (!user) {
    return <Navigate to="/login" replace />;
  }

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