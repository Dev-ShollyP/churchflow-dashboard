'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, MessageSquare, Heart, Calendar,
  Settings, LogOut, ChevronRight, UploadCloud, QrCode, UserCheck, Shield
} from 'lucide-react';
import { getCurrentStaff, StaffMember, PermissionKey, roleLabels, defaultRolePermissions, hasPermission, isAdmin } from '@/lib/supabase';
import ThemeSwitcher from './ThemeSwitcher';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  permissionKey: PermissionKey;
}

const navItems: NavItem[] = [
  { href: '/',               label: 'Overview',          icon: LayoutDashboard, permissionKey: 'overview' },
  { href: '/members',        label: 'Members',            icon: Users,           permissionKey: 'members' },
  { href: '/conversations',  label: 'Conversations',      icon: MessageSquare,   permissionKey: 'conversations' },
  { href: '/prayers',        label: 'Prayer Requests',    icon: Heart,           permissionKey: 'prayers' },
  { href: '/events',         label: 'Events & Programs',  icon: Calendar,        permissionKey: 'events' },
  { href: '/events/upload',  label: 'Upload Flyers',      icon: UploadCloud,     permissionKey: 'upload' },
  { href: '/onboarding',     label: 'Member Onboarding',  icon: QrCode,          permissionKey: 'onboarding' },
  { href: '/staff',          label: 'Staff & Permissions',icon: UserCheck,       permissionKey: 'staff' },
  { href: '/settings',       label: 'Settings',           icon: Settings,        permissionKey: 'settings' },
];

export default function Sidebar() {
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

  // Filter nav items based on actual permissions
  const filteredNavItems = navItems.filter(item =>
    hasPermission(staff, item.permissionKey)
  );

  const userRole = staff?.role ?? 'followup_team';
  const roleInfo = roleLabels[userRole] ?? roleLabels.followup_team;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col z-30"
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-gold)' }}>

      {/* Logo area & Theme Switcher */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6914)', boxShadow: '0 0 16px rgba(201,168,76,0.3)' }}>
            <span className="text-navy-dark font-display font-bold text-sm">EVF</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold text-sm text-gold leading-tight">RCCG EVF</p>
            <p className="text-[10px] text-white/40 leading-tight truncate">Everflourishing Sanctuary</p>
          </div>
        </div>
      </div>

      {/* User Role & Profile Card — clickable to go to /profile */}
      {staff && (
        <Link href="/profile" className="px-4 py-3 border-b border-white/5 bg-black/20 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6914)' }}>
              {(staff as any).avatar_url ? (
                <img src={(staff as any).avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px] font-bold text-navy-dark">
                  {(staff.full_name || staff.email || 'S')[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate flex items-center gap-1">
                {isAdmin(staff) && <Shield size={12} className="text-red-400 flex-shrink-0" />}
                {staff.full_name || staff.email}
              </p>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-[9px] font-bold border ${roleInfo.badgeClass}`}>
                {roleInfo.label}
              </span>
            </div>
          </div>
          <ThemeSwitcher />
        </Link>
      )}

      {/* Navigation — only shows pages this user has access to */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium group transition-all duration-200 ${
                isActive
                  ? 'nav-active'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={17} className={isActive ? 'text-gold' : 'text-white/40 group-hover:text-white/70'} />
              <span className="flex-1 truncate">{label}</span>
              {isActive && <ChevronRight size={13} className="text-gold/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/30 border border-white/5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-gold" />
          <span className="text-[11px] text-white/50 font-medium">WhatsApp Bot Live</span>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
        >
          <LogOut size={16} className="group-hover:text-red-400" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
