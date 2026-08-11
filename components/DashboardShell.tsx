'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen text-white overflow-x-hidden relative">
      {/* Background ambient lighting effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full bg-gold/5 blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-0 right-10 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl pointer-events-none z-0" />

      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Surface */}
      <main className="flex-1 ml-0 lg:ml-64 min-h-screen flex flex-col w-full max-w-full overflow-x-hidden relative z-10 transition-all duration-200 ease-out-custom">
        <TopHeader onOpenSidebar={() => setSidebarOpen(true)} />
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in flex-1 w-full max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
