
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import InstallAppModal from '../ui/InstallAppModal';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isInstallModalOpen, setInstallModalOpen] = useState(false);

  return (
    <>
      <InstallAppModal isOpen={isInstallModalOpen} onClose={() => setInstallModalOpen(false)} />
      <div className="flex h-screen bg-page-bg text-text-secondary">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} setInstallModalOpen={setInstallModalOpen} />

        <div className="flex flex-col flex-1 overflow-y-auto">
          <Header setSidebarOpen={setSidebarOpen} />
          
          <main className="p-4 md:p-8 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;