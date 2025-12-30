import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../layout/DashboardLayout";
import { UserProvider } from "../../context/UserContext";
import { DataProvider } from "../../context/DataContext";

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. Initial Cold Boot (only visible for a few ms)
  if (loading && !user) {
    return (
        <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center">
             <img 
                src="https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp" 
                alt="AMAZ" 
                className="h-10 mb-6 animate-pulse" 
            />
            <div className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-brand-gold animate-[loading_2s_ease-in-out_infinite]"></div>
            </div>
            <style>{`
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
  }

  // 2. Auth checked and definitively no user found -> Force login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. User authenticated (or cached) -> Render Dashboard immediately
  return (
    <UserProvider>
      <DataProvider>
        <DashboardLayout>
          <Outlet />
        </DashboardLayout>
      </DataProvider>
    </UserProvider>
  );
};

export default ProtectedRoute;