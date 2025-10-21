import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../layout/DashboardLayout';

const InitializingLoader = () => (
    <div className="flex items-center justify-center h-screen bg-page-bg">
        <div className="w-10 h-10 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin"></div>
    </div>
);

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <InitializingLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <DashboardLayout />;
};

export default ProtectedRoute;