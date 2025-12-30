
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import { UserProvider } from "../../context/UserContext";
import { DataProvider } from "../../context/DataContext";

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. SILENT TRANSITION: Wait for the session to be verified
  if (loading) {
    return null; 
  }

  // 2. AUTH GUARD: Redirect to login if no identity exists
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. IDENTITY-KEYED MOUNT: 
  // By using user.id as a KEY, React will destroy and recreate the Providers 
  // every time the user changes (e.g. at Login). This guarantees an 
  // immediate, fresh data fetch from the database.
  return (
    <UserProvider key={`users-${user.id}`}>
      <DataProvider key={`data-${user.id}`}>
        <DashboardLayout>
          <Outlet />
        </DashboardLayout>
      </DataProvider>
    </UserProvider>
  );
};

export default ProtectedRoute;
