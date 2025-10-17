import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../layout/DashboardLayout';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    // While checking auth status, render nothing. This prevents a flash of the login page
    // for authenticated users and is faster than a full loader.
    return null;
  }

  if (!user) {
    // Auth check is complete and there's no user, so redirect to login.
    return <Navigate to="/login" replace />;
  }
  
  // Auth check is complete and there is a user, render the main dashboard.
  return <DashboardLayout />;
};

export default ProtectedRoute;