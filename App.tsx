import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-page-bg">
        <div className="spinner"></div>
      </div>
    );
  }

  const renderDashboard = () => {
    if (!user) return <Navigate to="/login" />;
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

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <DashboardLayout /> : <Navigate to="/login" />}>
          <Route index element={renderDashboard()} />
          <Route path="projects" element={<ProjectsList />} />
          <Route path="projects/:projectId" element={<ProjectDetails />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="account" element={<MyAccount />} />
          
          {/* Admin Routes */}
          {user?.role === 'Admin' && (
            <>
              <Route path="overview" element={<AdminOverview />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="attendance" element={<AttendanceLogs />} />
              <Route path="reports" element={<FinancialReports />} />
              <Route path="settings" element={<AdminSettings />} />
            </>
          )}

          {/* Designer Routes */}
          {user?.role === 'Designer' && (
            <>
              <Route path="task-board" element={<TaskBoard />} />
              <Route path="my-calendar" element={<MyCalendar />} />
              <Route path="team-calendar" element={<TeamCalendar />} />
              <Route path="leave" element={<LeaveManagement />} />
              <Route path="daily-work" element={<DailyWork />} />
              <Route path="my-attendance" element={<MyAttendance />} />
            </>
          )}

          {/* Customer Routes */}
          {user?.role === 'Customer' && (
            <>
             <Route path="billing" element={<BillingHistory />} />
            </>
          )}

          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;