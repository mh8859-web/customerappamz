
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import DesignerDashboard from "./pages/dashboards/DesignerDashboard";
import CustomerDashboard from "./pages/dashboards/CustomerDashboard";
import AccountsDashboard from "./pages/dashboards/AccountsDashboard";
import ProjectHeadDashboard from "./pages/dashboards/ProjectHeadDashboard";
import ProductionHeadDashboard from "./pages/dashboards/ProductionHeadDashboard";
import SiteHeadDashboard from "./pages/dashboards/SiteHeadDashboard";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectsList from "./pages/ProjectsList";
import UserManagement from "./pages/admin/UserManagement";
import SalaryAllocation from "./pages/admin/SalaryAllocation";
import AttendanceLogs from "./pages/admin/AttendanceLogs";
import LeaveManagement from "./pages/designer/LeaveManagement";
import SupportPage from "./pages/shared/SupportPage";
import DailyWork from "./pages/designer/WorkDiary";
import MyAttendance from "./pages/designer/MyAttendance";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminOverview from "./pages/admin/AdminOverview";
import BillingHistory from "./pages/customer/BillingHistory";
import MyAccount from "./pages/customer/MyAccount";
import TaskBoard from "./pages/designer/TaskBoard";
import MyCalendar from "./pages/designer/MyCalendar";
import FinancialReports from "./pages/admin/FinancialReports";
import TeamCalendar from "./pages/designer/TeamCalendar";
import CommunityHub from "./pages/shared/CommunityHub";
import DownloadCenter from "./pages/shared/DownloadCenter";
import ProjectWall from "./pages/shared/ProjectWall";
import AboutPage from "./pages/shared/AboutPage";
import ChatPage from "./pages/shared/ChatPage";
import UserProfilePage from "./pages/shared/UserProfilePage";
import CurrentWorks from "./pages/designer/CurrentWorks";
import WorkTracking from "./pages/admin/WorkTracking";
import Button from "./components/ui/Button";
import HourlyPromptModal from "./components/designer/HourlyPromptModal";

const DashboardRedirect: React.FC = () => {
  const { user, logout } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case "Admin":
    case "Sub-Admin":
      return <Navigate to="/admin/dashboard" replace />;
    case "Designer":
      return <Navigate to="/designer/dashboard" replace />;
    case "Customer":
      return <Navigate to="/customer/dashboard" replace />;
    case "Accounts":
      return <Navigate to="/accounts/dashboard" replace />;
    case "Project Head":
      return <Navigate to="/project-head/dashboard" replace />;
    case "Production Head":
      return <Navigate to="/production-head/dashboard" replace />;
    case "Site Head":
      return <Navigate to="/site-head/dashboard" replace />;
    default:
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-page-bg p-4">
          <div className="bg-surface p-8 rounded-2xl shadow-card text-center max-w-md">
            <h1 className="text-xl font-bold text-text-primary mb-2">Access Issue</h1>
            <p className="text-text-secondary mb-6">
              Your account has a role ({user.role}) that is not configured for a dashboard. Please contact support.
            </p>
            <Button onClick={() => logout()}>Logout</Button>
          </div>
        </div>
      );
  }
};

const RoleBasedRoutes: React.FC<{ allowedRoles: string[] }> = ({ allowedRoles }) => {
  const { user } = useAuth();
  return user && allowedRoles.includes(user.role) ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace />
  );
};

const HourlyPromptListener: React.FC = () => {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (user?.role !== 'Designer') return;
    const interval = setInterval(() => {
      const lastUpdate = localStorage.getItem(`last_hourly_update_${user.id}`);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      if (!lastUpdate || now - parseInt(lastUpdate) > oneHour) {
        setShowPrompt(true);
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user]);

  if (!showPrompt) return null;
  return <HourlyPromptModal isOpen={showPrompt} onClose={() => setShowPrompt(false)} />;
};

const App: React.FC = () => {
  return (
    <>
      <HourlyPromptListener />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute />}>
          <Route index element={<DashboardRedirect />} />
          <Route path="profile/:userId" element={<UserProfilePage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="chat/:projectId" element={<ChatPage />} />
          <Route path="projects" element={<ProjectsList />} />
          <Route path="projects/:projectId" element={<ProjectDetails />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="account" element={<MyAccount />} />
          <Route path="downloads" element={<DownloadCenter />} />
          <Route path="project-wall" element={<ProjectWall />} />
          <Route path="about" element={<AboutPage />} />
          <Route element={<RoleBasedRoutes allowedRoles={["Admin", "Sub-Admin"]} />}>
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/overview" element={<AdminOverview />} />
            <Route path="admin/attendance" element={<AttendanceLogs />} />
            <Route path="admin/reports" element={<FinancialReports />} />
            <Route path="admin/users" element={<UserManagement />} />
            <Route path="admin/salary-allocation" element={<SalaryAllocation />} />
            <Route path="admin/work-tracking" element={<WorkTracking />} />
            <Route element={<RoleBasedRoutes allowedRoles={["Admin"]} />}>
              <Route path="admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>
          <Route element={<RoleBasedRoutes allowedRoles={["Designer"]} />}>
            <Route path="designer/dashboard" element={<DesignerDashboard />} />
            <Route path="designer/current-works" element={<CurrentWorks />} />
            <Route path="designer/task-board" element={<TaskBoard />} />
            <Route path="designer/my-calendar" element={<MyCalendar />} />
            <Route path="designer/team-calendar" element={<TeamCalendar />} />
            <Route path="designer/leave" element={<LeaveManagement />} />
            <Route path="designer/daily-work" element={<DailyWork />} />
            <Route path="designer/my-attendance" element={<MyAttendance />} />
          </Route>
          <Route element={<RoleBasedRoutes allowedRoles={["Customer"]} />}>
            <Route path="customer/dashboard" element={<CustomerDashboard />} />
            <Route path="customer/billing" element={<BillingHistory />} />
          </Route>
          <Route element={<RoleBasedRoutes allowedRoles={["Accounts"]} />}>
            <Route path="accounts/dashboard" element={<AccountsDashboard />} />
          </Route>
          <Route element={<RoleBasedRoutes allowedRoles={["Project Head"]} />}>
            <Route path="project-head/dashboard" element={<ProjectHeadDashboard />} />
          </Route>
          <Route element={<RoleBasedRoutes allowedRoles={["Production Head"]} />}>
            <Route path="production-head/dashboard" element={<ProductionHeadDashboard />} />
          </Route>
          <Route element={<RoleBasedRoutes allowedRoles={["Site Head"]} />}>
            <Route path="site-head/dashboard" element={<SiteHeadDashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
