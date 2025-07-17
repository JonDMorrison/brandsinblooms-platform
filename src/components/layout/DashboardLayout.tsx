import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';

const DashboardLayout = () => {
  const location = useLocation();
  
  return (
    <div className="h-screen bg-gradient-subtle">
      <div className="flex h-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;