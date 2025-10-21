import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../layout/DashboardLayout';

const InitializingLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-page-bg">
    <div className="w-8 h-8 border-4 border-blue-200 border-t-brand-blue rounded-full animate-spin"></div>
  </div>
);

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // Show a loader while the initial session check is happening.
    // This PREVENTS the blank screen and the redirect loop.
    return <InitializingLoader />;
  }

  if (!user) {
    // The check is complete and there is no user. Redirect to login.
    return <Navigate to="/login" replace />;
  }
  
  // The check is complete and there is a user. Show the dashboard.
  return <DashboardLayout />;
};

export default ProtectedRoute;