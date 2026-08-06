'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Calendar, UploadCloud, Menu } from 'lucide-react';
import { getCurrentStaff, StaffMember } from '@/lib/supabase';

interface TopHeaderProps {
  onOpenSidebar?: () => void;
}

export default function TopHeader({ onOpenSidebar }: TopHeaderProps) {
  const [staff, setStaff] = useState<StaffMember | null>(null);

  useEffect(() => {
    getCurrentStaff().then(setStaff);
  }, []);

  return (
    <header className="sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-3 lg:py-4 backdrop-blur-md bg-opacity-70 border-b border-white/5 flex items-center justify-between gap-3"
      style={{ background: 'rgba(4, 12, 30, 0.85)', borderColor: 'var(--border-gold)' }}>

      {/* Left: Mobile Menu Toggle + Quick Search */}
      <div className="flex items-center gap-2.5 flex-1 max-w-md">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-white/70 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex-shrink-0"
          aria-label="Open mobile menu"
        >
          <Menu size={18} />
        </button>

        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search members, events..."
            className="w-full pl-9 pr-3 py-1.5 sm:py-2 rounded-xl text-xs text-white placeholder-white/25 bg-white/5 border border-white/10 focus:border-gold/50 focus:bg-white/10 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Right: Quick Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

        {/* Quick Upload Flyer button */}
        <Link
          href="/events/upload"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold btn-gold"
        >
          <UploadCloud size={14} />
          <span>Upload Flyer</span>
        </Link>

        {/* Quick Event button */}
        <Link
          href="/events"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium btn-glass"
        >
          <Calendar size={14} className="text-gold" />
          <span>Events</span>
        </Link>

        {/* Divider */}
        <div className="h-5 w-px bg-white/10 mx-0.5 hidden sm:block" />

        {/* Profile Avatar Badge */}
        {staff && (
          <Link
            href="/profile"
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-gold/30 hover:bg-white/10 transition-all group"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6914)' }}>
              {(staff as any).avatar_url ? (
                <img src={(staff as any).avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-navy-dark">
                  {(staff.full_name || staff.email || 'S')[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-medium text-white group-hover:text-gold transition-colors leading-tight truncate max-w-[120px]">
                {staff.full_name || staff.email.split('@')[0]}
              </p>
              <p className="text-[9px] text-white/35 capitalize leading-tight">
                {staff.role.replace('_', ' ')}
              </p>
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
