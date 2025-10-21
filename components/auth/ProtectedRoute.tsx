import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import { UserProvider } from "../../context/UserContext";
import { DataProvider } from "../../context/DataContext";

const ProtectedRoute: React.FC = () => {
  const { user } = useAuth();

  // The main App component now handles the initial loading state.
  // This component's only responsibility is to check for an authenticated user.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wrap the entire authenticated app in the necessary data providers.
  // This ensures all child routes have access to user and project data.
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