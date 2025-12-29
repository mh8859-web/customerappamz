import React, { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false); // For desktop

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prevState => !prevState);
  };

  return (
    <div className="flex h-screen bg-page-bg text-text-secondary">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        isCollapsed={isSidebarCollapsed}
        toggleCollapsed={toggleSidebarCollapse}
      />

      <div className="flex flex-col flex-1 overflow-y-auto">
        <Header 
          setSidebarOpen={setSidebarOpen} 
          toggleSidebarCollapse={toggleSidebarCollapse}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        
        <main className="p-4 md:p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;