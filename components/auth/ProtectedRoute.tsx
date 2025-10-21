import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../layout/DashboardLayout';

const ProtectedRoute: React.FC = () => {
  const { user } = useAuth();

  // On the initial render, `user` will be `null` while the AuthContext's effect runs.
  // This will cause an immediate redirect to login.
  // Once the session is confirmed, the `user` object will be populated,
  // causing a re-render and successful navigation to the dashboard.
  // This creates a "flicker" effect but avoids any blank screens or loaders.
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <DashboardLayout />;
};

export default ProtectedRoute;