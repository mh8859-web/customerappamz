import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import DashboardLayout from '../layout/DashboardLayout';

const InitializingLoader = () => (
    <div className="flex items-center justify-center h-screen bg-page-bg">
        <div className="w-10 h-10 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin"></div>
    </div>
);

const ProtectedRoute: React.FC = () => {
  const { status } = useAppContext();

  if (status === 'initializing') {
    return <InitializingLoader />;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace />;
  }
  
  return <DashboardLayout />;
};

export default ProtectedRoute;
