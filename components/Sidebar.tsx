'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, MessageSquare, Heart, Calendar,
  Settings, LogOut, ChevronRight, UploadCloud, QrCode, UserCheck, Shield, X, Sparkles, BookOpen
} from 'lucide-react';
import { getCurrentStaff, StaffMember, PermissionKey, roleLabels, hasPermission, isAdmin } from '@/lib/supabase';
import ThemeSwitcher from './ThemeSwitcher';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  permissionKey: PermissionKey;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems: NavItem[] = [
  { href: '/',               label: 'Overview',           icon: LayoutDashboard, permissionKey: 'overview' },
  { href: '/members',        label: 'Members Directory',   icon: Users,           permissionKey: 'members' },
  { href: '/conversations',  label: 'Live Conversations',  icon: MessageSquare,   permissionKey: 'conversations' },
  { href: '/prayers',        label: 'Prayer Requests',     icon: Heart,           permissionKey: 'prayers' },
  { href: '/events',         label: 'Events & Programs',   icon: Calendar,        permissionKey: 'events' },
  { href: '/hymns',          label: 'RCCG Hymnal (826)',   icon: BookOpen,        permissionKey: 'hymns' },
  { href: '/events/upload',  label: 'Upload Flyer',        icon: UploadCloud,     permissionKey: 'upload' },
  { href: '/onboarding',     label: 'Member Onboarding',   icon: QrCode,          permissionKey: 'onboarding' },
  { href: '/staff',          label: 'Staff & Roles',       icon: UserCheck,       permissionKey: 'staff' },
  { href: '/settings',       label: 'Settings',            icon: Settings,        permissionKey: 'settings' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [staff, setStaff] = useState<StaffMember | null>(null);

  useEffect(() => {
    getCurrentStaff().then(setStaff);
  }, []);

  const handleLogout = () => {
    document.cookie = 'churchflow_staff_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'churchflow_staff_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/login';
  };

  const filteredNavItems = navItems.filter(item =>
    hasPermission(staff, item.permissionKey)
  );

  const userRole = staff?.role ?? 'followup_team';
  const roleInfo = roleLabels[userRole] ?? roleLabels.followup_team;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 lg:hidden transition-opacity duration-200 animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Shell */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 lg:w-64 flex flex-col z-50 transition-transform duration-200 ease-out-custom transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          background: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--border-gold)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between px-5 py-4 sm:py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-gold"
              style={{ background: 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-gold-dark))' }}
            >
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold text-sm text-gold leading-tight tracking-wide">RCCG EVF</p>
              <p className="text-[10px] text-white/50 leading-tight truncate">Everflourishing Sanctuary</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Card */}
        {staff && (
          <div className="px-4 py-3 border-b border-white/5 bg-black/20 flex items-center justify-between">
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-2.5 min-w-0 flex-1 group hover:opacity-90 transition-opacity"
            >
              <div
                className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center border border-gold/40 shadow-sm"
                style={{ background: 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-gold-dark))' }}
              >
                {(staff as any).avatar_url ? (
                  <img src={(staff as any).avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[11px] font-bold text-slate-950">
                    {(staff.full_name || staff.email || 'S')[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate flex items-center gap-1 group-hover:text-gold transition-colors">
                  {isAdmin(staff) && <Shield size={12} className="text-red-400 flex-shrink-0" />}
                  {staff.full_name || staff.email}
                </p>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-[9px] font-bold border ${roleInfo.badgeClass}`}>
                  {roleInfo.label}
                </span>
              </div>
            </Link>

            <ThemeSwitcher />
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Sidebar navigation">
          {filteredNavItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'nav-active font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-gold' : 'text-white/40 group-hover:text-white/80'} />
                <span className="flex-1 truncate">{label}</span>
                {isActive && <ChevronRight size={14} className="text-gold/70" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer Status & Sign Out */}
        <div className="px-3 py-4 border-t border-white/10 space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-black/40 border border-white/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] text-white/60 font-medium">WhatsApp Bot Connected</span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 group"
          >
            <LogOut size={16} className="group-hover:text-red-400" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
