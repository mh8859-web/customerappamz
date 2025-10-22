import React from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import DesignerDashboard from "./pages/dashboards/DesignerDashboard";
import CustomerDashboard from "./pages/dashboards/CustomerDashboard";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectsList from "./pages/ProjectsList";
import UserManagement from "./pages/admin/UserManagement";
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

const DashboardRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case "Admin":
    case "Sub-Admin":
      return <Navigate to="/admin/dashboard" replace />;
    case "Designer":
      return <Navigate to="/designer/dashboard" replace />;
    case "Customer":
      return <Navigate to="/customer/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
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

      {/* Wrap everything inside ProtectedRoute */}
      <Route path="/" element={<ProtectedRoute />}>
        <Route index element={<DashboardRedirect />} />

        {/* Shared Routes */}
        <Route path="hub" element={<CommunityHub />} />
        <Route path="projects" element={<ProjectsList />} />
        <Route path="projects/:projectId" element={<ProjectDetails />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="account" element={<MyAccount />} />
        <Route path="downloads" element={<DownloadCenter />} />
        <Route path="project-wall" element={<ProjectWall />} />
        <Route path="about" element={<AboutPage />} />

        {/* Admin & Sub-Admin */}
        <Route
          element={<RoleBasedRoutes allowedRoles={["Admin", "Sub-Admin"]} />}
        >
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="admin/overview" element={<AdminOverview />} />
          <Route path="admin/attendance" element={<AttendanceLogs />} />
          <Route path="admin/reports" element={<FinancialReports />} />
          <Route path="admin/users" element={<UserManagement />} />

          {/* Full Admin only */}
          <Route element={<RoleBasedRoutes allowedRoles={["Admin"]} />}>
            <Route path="admin/settings" element={<AdminSettings />} />
          </Route>
        </Route>

        {/* Designer */}
        <Route element={<RoleBasedRoutes allowedRoles={["Designer"]} />}>
          <Route path="designer/dashboard" element={<DesignerDashboard />} />
          <Route path="designer/task-board" element={<TaskBoard />} />
          <Route path="designer/my-calendar" element={<MyCalendar />} />
          <Route path="designer/team-calendar" element={<TeamCalendar />} />
          <Route path="designer/leave" element={<LeaveManagement />} />
          <Route path="designer/daily-work" element={<DailyWork />} />
          <Route path="designer/my-attendance" element={<MyAttendance />} />
        </Route>

        {/* Customer */}
        <Route element={<RoleBasedRoutes allowedRoles={["Customer"]} />}>
          <Route path="customer/dashboard" element={<CustomerDashboard />} />
          <Route path="customer/billing" element={<BillingHistory />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default App;