import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        <TopHeader />
        <div className="p-8 animate-fade-in flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
