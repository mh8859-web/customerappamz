import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../layout/DashboardLayout';

const ProtectedRoute: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    // There's no user, so redirect to login instantly.
    return <Navigate to="/login" replace />;
  }
  
  // There is a user, render the main dashboard instantly.
  return <DashboardLayout />;
};

export default ProtectedRoute;