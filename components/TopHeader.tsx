'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Bell, Sparkles, User, Calendar, UploadCloud } from 'lucide-react';
import { getCurrentStaff, StaffMember } from '@/lib/supabase';

export default function TopHeader() {
  const [staff, setStaff] = useState<StaffMember | null>(null);

  useEffect(() => {
    getCurrentStaff().then(setStaff);
  }, []);

  return (
    <header className="sticky top-0 z-20 px-8 py-4 backdrop-blur-md bg-opacity-70 border-b border-white/5 flex items-center justify-between gap-4"
      style={{ background: 'rgba(4, 12, 30, 0.75)', borderColor: 'var(--border-gold)' }}>

      {/* Left: Quick Search */}
      <div className="relative flex-1 max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          placeholder="Quick search members, conversations, events..."
          className="w-full pl-10 pr-4 py-2 rounded-xl text-xs text-white placeholder-white/25 bg-white/5 border border-white/10 focus:border-gold/50 focus:bg-white/10 focus:outline-none transition-all"
        />
      </div>

      {/* Right: Quick Actions & Profile */}
      <div className="flex items-center gap-3">

        {/* Quick Upload Flyer button */}
        <Link
          href="/events/upload"
          className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold btn-gold"
        >
          <UploadCloud size={14} />
          <span>Upload Flyer</span>
        </Link>

        {/* Quick Event button */}
        <Link
          href="/events"
          className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium btn-glass"
        >
          <Calendar size={14} className="text-gold" />
          <span>Events</span>
        </Link>

        {/* Divider */}
        <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

        {/* Profile Avatar Badge */}
        {staff && (
          <Link
            href="/profile"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-gold/30 hover:bg-white/10 transition-all group"
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
            <div className="hidden lg:block text-left">
              <p className="text-xs font-medium text-white group-hover:text-gold transition-colors leading-tight">
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
