import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import InstallAppModal from '../ui/InstallAppModal';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isInstallModalOpen, setInstallModalOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Show install modal after a short delay to not be too intrusive
      setTimeout(() => {
        // Only show if not already installed (basic check)
        if (!window.matchMedia('(display-mode: standalone)').matches) {
            setInstallModalOpen(true);
        }
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = () => {
    if (!installPrompt) return;
    (installPrompt as any).prompt();
    (installPrompt as any).userChoice.then(() => {
      setInstallPrompt(null);
      setInstallModalOpen(false);
    });
  };


  return (
    <>
      <InstallAppModal 
        isOpen={isInstallModalOpen}
        onClose={() => setInstallModalOpen(false)}
        onInstall={handleInstall}
      />
      <div className="flex h-screen bg-page-bg text-text-secondary">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

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
