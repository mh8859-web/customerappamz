import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import { UserProvider } from "../../context/UserContext";
import { DataProvider } from "../../context/DataContext";

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // If we are actively checking the session for the first time and have no user info, 
  // we wait silently for a few milliseconds.
  if (loading && !user) {
    return null; // Show nothing or a very tiny spinner, never a full screen block
  }

  // Definitively no user -> Login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User exists (or shell exists) -> App
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