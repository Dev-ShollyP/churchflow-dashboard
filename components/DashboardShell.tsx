'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-navy-dark text-white overflow-x-hidden">
      {/* Sidebar Navigation (Mobile Drawer + Desktop Sidebar) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 ml-0 lg:ml-64 min-h-screen flex flex-col w-full max-w-full overflow-x-hidden transition-all duration-300">
        <TopHeader onOpenSidebar={() => setSidebarOpen(true)} />
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in flex-1 w-full max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
