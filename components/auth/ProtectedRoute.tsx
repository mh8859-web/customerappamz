import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../layout/DashboardLayout';

const FullPageLoader: React.FC = () => (
    <div className="flex items-center justify-center h-screen bg-page-bg">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-blue"></div>
    </div>
);

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // Wait until the initial session check is complete before rendering anything.
    // This is the key fix for the race condition on app load.
    return <FullPageLoader />;
  }

  if (!user) {
    // If the check is complete and there's no authenticated user,
    // redirect them to the login page.
    return <Navigate to="/login" replace />;
  }
  
  // If the check is complete and a user exists, render the main
  // dashboard layout, which will in turn render the correct child route via <Outlet />.
  return <DashboardLayout />;
};

export default ProtectedRoute;
