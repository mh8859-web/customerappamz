import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../layout/DashboardLayout';

const FullPageLoader = () => (
    <div className="flex items-center justify-center h-screen w-screen bg-page-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
    </div>
);

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // While checking auth status, show a loader. This is crucial to prevent race conditions.
    return <FullPageLoader />;
  }

  if (!user) {
    // Auth check is complete and there's no user, so redirect to login.
    return <Navigate to="/login" replace />;
  }
  
  // Auth check is complete and there is a user, render the main dashboard.
  return <DashboardLayout />;
};

export default ProtectedRoute;