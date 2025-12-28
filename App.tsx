import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext.tsx";
import Login from "./pages/Login.tsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.tsx";
import AdminDashboard from "./pages/dashboards/AdminDashboard.tsx";
import DesignerDashboard from "./pages/dashboards/DesignerDashboard.tsx";
import CustomerDashboard from "./pages/dashboards/CustomerDashboard.tsx";
import AccountsDashboard from "./pages/dashboards/AccountsDashboard.tsx";
import ProjectHeadDashboard from "./pages/dashboards/ProjectHeadDashboard.tsx";
import ProductionHeadDashboard from "./pages/dashboards/ProductionHeadDashboard.tsx";
import SiteHeadDashboard from "./pages/dashboards/SiteHeadDashboard.tsx";
import ProjectDetails from "./pages/ProjectDetails.tsx";
import ProjectsList from "./pages/ProjectsList.tsx";
import UserManagement from "./pages/admin/UserManagement.tsx";
import AttendanceLogs from "./pages/admin/AttendanceLogs.tsx";
import LeaveManagement from "./pages/designer/LeaveManagement.tsx";
import SupportPage from "./pages/shared/SupportPage.tsx";
import DailyWork from "./pages/designer/WorkDiary.tsx";
import MyAttendance from "./pages/designer/MyAttendance.tsx";
import AdminSettings from "./pages/admin/AdminSettings.tsx";
import AdminOverview from "./pages/admin/AdminOverview.tsx";
import BillingHistory from "./pages/customer/BillingHistory.tsx";
import MyAccount from "./pages/customer/MyAccount.tsx";
import TaskBoard from "./pages/designer/TaskBoard.tsx";
import MyCalendar from "./pages/designer/MyCalendar.tsx";
import FinancialReports from "./pages/admin/FinancialReports.tsx";
import TeamCalendar from "./pages/designer/TeamCalendar.tsx";
import CommunityHub from "./pages/shared/CommunityHub.tsx";
import DownloadCenter from "./pages/shared/DownloadCenter.tsx";
import ProjectWall from "./pages/shared/ProjectWall.tsx";
import AboutPage from "./pages/shared/AboutPage.tsx";
import ChatPage from "./pages/shared/ChatPage.tsx";
import UserProfilePage from "./pages/shared/UserProfilePage.tsx";
import Button from "./components/ui/Button.tsx";

const DashboardRedirect: React.FC = () => {
  const { user, logout } = useAuth();
  if (!user) return <div className="p-10 text-center">Initializing...</div>;

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
              Your account has a role ({user.role}) that is not configured for a dashboard.
            </p>
            <Button onClick={() => logout()}>Logout</Button>
          </div>
        </div>
      );
  }
};

const RoleBasedRoutes: React.FC<{ allowedRoles: string[] }> = ({
  allowedRoles,
}) => {
  const { user } = useAuth();
  return user && allowedRoles.includes(user.role) ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace />
  );
};

const App: React.FC = () => {
  return (
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
          <Route path="admin/settings" element={<AdminSettings />} />
        </Route>
        <Route element={<RoleBasedRoutes allowedRoles={["Designer"]} />}>
          <Route path="designer/dashboard" element={<DesignerDashboard />} />
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
  );
};

export default App;