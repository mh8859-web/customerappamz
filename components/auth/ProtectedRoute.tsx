import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import { UserProvider } from "../../context/UserContext";
import { DataProvider } from "../../context/DataContext";
import AppShell from "../ui/AppShell";

const ProtectedRoute: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  // Show the high-fidelity skeleton only while we have NO user data 
  // and we are actively checking the initial session.
  if (authLoading && !user) {
    return <AppShell />;
  }

  // If loading finished and still no user, they need to log in.
  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  // If we have a user (even if some profile data is still syncing), 
  // let them into the dashboard layout.
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