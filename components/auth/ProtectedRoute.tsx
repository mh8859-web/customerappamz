import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../layout/DashboardLayout';

const ProtectedRoute: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    // If there's no authenticated user, redirect them to the login page.
    return <Navigate to="/login" replace />;
  }
  
  // If a user exists, render the main dashboard layout.
  return <DashboardLayout />;
};

export default ProtectedRoute;