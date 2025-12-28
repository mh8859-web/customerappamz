import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.tsx";
import DashboardLayout from "../layout/DashboardLayout.tsx";
import { UserProvider } from "../../context/UserContext.tsx";
import { DataProvider } from "../../context/DataContext.tsx";
import AppShell from "../ui/AppShell.tsx";

const ProtectedRoute: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return <AppShell />;
  }

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