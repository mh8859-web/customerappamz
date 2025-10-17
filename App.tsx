import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import DesignerDashboard from './pages/dashboards/DesignerDashboard';
import CustomerDashboard from './pages/dashboards/CustomerDashboard';
import ProjectDetails from './pages/ProjectDetails';
import ProjectsList from './pages/ProjectsList';
import UserManagement from './pages/admin/UserManagement';
import AttendanceLogs from './pages/admin/AttendanceLogs';
import LeaveManagement from './pages/designer/LeaveManagement';
import SupportPage from './pages/shared/SupportPage';
import DailyWork from './pages/designer/WorkDiary';
import MyAttendance from './pages/designer/MyAttendance';
import AdminSettings from './pages/admin/AdminSettings';
import AdminOverview from './pages/admin/AdminOverview';
import BillingHistory from './pages/customer/BillingHistory';
import MyAccount from './pages/customer/MyAccount';
import TaskBoard from './pages/designer/TaskBoard';
import MyCalendar from './pages/designer/MyCalendar';
import FinancialReports from './pages/admin/FinancialReports';
import TeamCalendar from './pages/designer/TeamCalendar';
import CommunityHub from './pages/shared/CommunityHub';
import DownloadCenter from './pages/shared/DownloadCenter';
import ProjectWall from './pages/shared/ProjectWall';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Helper component to redirect to the correct dashboard based on user role
const DashboardRedirect: React.FC = () => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />; // Should be caught by ProtectedRoute, but here for safety
    
    switch (user.role) {
      case 'Admin':
        return <AdminDashboard />;
      case 'Designer':
        return <DesignerDashboard />;
      case 'Customer':
        return <CustomerDashboard />;
      default:
        return <Navigate to="/login" />;
    }
};

// Role-specific route wrappers to protect routes inside the dashboard
const AdminRoutes: React.FC = () => {
    const { user } = useAuth();
    return user?.role === 'Admin' ? <Outlet /> : <Navigate to="/" replace />;
};
const DesignerRoutes: React.FC = () => {
    const { user } = useAuth();
    return user?.role === 'Designer' ? <Outlet /> : <Navigate to="/" replace />;
};
const CustomerRoutes: React.FC = () => {
    const { user } = useAuth();
    return user?.role === 'Customer' ? <Outlet /> : <Navigate to="/" replace />;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* All protected routes are now children of the ProtectedRoute component */}
      <Route path="/" element={<ProtectedRoute />}>
          <Route index element={<DashboardRedirect />} />
          <Route path="hub" element={<CommunityHub />} />
          <Route path="projects" element={<ProjectsList />} />
          <Route path="projects/:projectId" element={<ProjectDetails />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="account" element={<MyAccount />} />
          <Route path="downloads" element={<DownloadCenter />} />
          <Route path="project-wall" element={<ProjectWall />} />

          {/* Admin Routes */}
          <Route element={<AdminRoutes />}>
              <Route path="overview" element={<AdminOverview />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="attendance" element={<AttendanceLogs />} />
              <Route path="reports" element={<FinancialReports />} />
              <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Designer Routes */}
          <Route element={<DesignerRoutes />}>
              <Route path="task-board" element={<TaskBoard />} />
              <Route path="my-calendar" element={<MyCalendar />} />
              <Route path="team-calendar" element={<TeamCalendar />} />
              <Route path="leave" element={<LeaveManagement />} />
              <Route path="daily-work" element={<DailyWork />} />
              <Route path="my-attendance" element={<MyAttendance />} />
          </Route>
          
          {/* Customer Routes */}
          <Route element={<CustomerRoutes />}>
              <Route path="billing" element={<BillingHistory />} />
          </Route>

          {/* Fallback for any other authenticated route */}
          <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      
      {/* Global fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;