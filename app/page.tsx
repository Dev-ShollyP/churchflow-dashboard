'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { createClient, getCurrentStaff, StaffMember } from '@/lib/supabase';
import { getCombinedUpcomingEvents, getNextUpcomingService } from '@/lib/services';
import { Users, MessageSquare, Heart, Calendar, TrendingUp, Clock, ArrowRight, Sparkles, MessageCircle, BookOpen } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';

export default function OverviewPage() {
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [data, setData] = useState({
    totalMembers: 0,
    totalConversations: 0,
    openConversations: 0,
    totalMessages: 0,
    pendingPrayers: 0,
    upcomingEvents: [] as any[],
    nextService: null as any,
    recentConversations: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      const supabase = createClient();

      const [staffRes, membersRes, convsRes, msgsRes, prayersRes, eventsRes, recentConvsRes] = await Promise.all([
        getCurrentStaff(),
        supabase.from('members').select('id', { count: 'exact' }),
        supabase.from('conversations').select('id, status', { count: 'exact' }),
        supabase.from('messages').select('id', { count: 'exact' }),
        supabase.from('prayer_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('events').select('id, title, event_date, start_time, description').gte('event_date', new Date().toISOString().slice(0, 10)).order('event_date', { ascending: true }).limit(5),
        supabase.from('conversations')
          .select('id, status, started_at, members(full_name, phone)')
          .order('started_at', { ascending: false })
          .limit(6),
      ]);

      const openConvs = convsRes.data?.filter(c => c.status === 'open').length ?? 0;
      const dbEvents = eventsRes.data ?? [];
      const combinedUpcoming = getCombinedUpcomingEvents(dbEvents, 14);
      const nextService = getNextUpcomingService(dbEvents);

      setStaff(staffRes);
      setData({
        totalMembers: membersRes.count ?? membersRes.data?.length ?? 0,
        totalConversations: convsRes.count ?? convsRes.data?.length ?? 0,
        openConversations: openConvs,
        totalMessages: msgsRes.count ?? msgsRes.data?.length ?? 0,
        pendingPrayers: prayersRes.count ?? prayersRes.data?.length ?? 0,
        upcomingEvents: combinedUpcoming.slice(0, 5),
        nextService,
        recentConversations: recentConvsRes.data ?? [],
      });
      setLoading(false);
    }

    loadDashboardData();
  }, []);

  const todayStr = format(new Date(), 'EEEE, MMMM do yyyy');
  const greetingName = staff?.full_name || staff?.email?.split('@')[0] || 'Sanctuary Team';

  return (
    <DashboardShell>
      {/* Hero Welcome Banner */}
      <div
        className="glass-card p-6 sm:p-8 md:p-10 mb-6 sm:mb-8 relative overflow-hidden transition-all"
        style={{
          background: 'radial-gradient(ellipse at 85% 15%, oklch(0.78 0.16 75 / 0.15) 0%, oklch(0.14 0.04 265 / 0.70) 70%)',
        }}
      >
        {/* Ambient Radial Glow */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold mb-3">
              <Sparkles size={13} />
              <span>Ogun Province 27 • Everflourishing Sanctuary</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
              Welcome back, <span className="text-gold-gradient">{greetingName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-white/60 mt-1.5 font-medium">
              {todayStr} • Live WhatsApp assistant &amp; church operations activity.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/hymns"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold btn-gold shadow-gold"
            >
              <BookOpen size={16} />
              <span>RCCG Hymnal</span>
            </Link>
            <Link
              href="/conversations"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium btn-glass"
            >
              <MessageCircle size={16} className="text-gold" />
              <span>WhatsApp Chats</span>
            </Link>
            <Link
              href="/prayers"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium btn-glass"
            >
              <Heart size={16} className="text-gold" />
              <span>Prayer Requests</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 mb-6 sm:mb-8">
        <StatCard
          label="Total Members"
          value={loading ? '...' : data.totalMembers}
          icon={Users}
          sub="Registered contacts"
          gold
        />
        <StatCard
          label="Open Conversations"
          value={loading ? '...' : data.openConversations}
          icon={MessageSquare}
          sub={`${data.totalConversations} total threads`}
        />
        <StatCard
          label="Messages Exchanged"
          value={loading ? '...' : data.totalMessages.toLocaleString()}
          icon={TrendingUp}
          sub="Bot & Staff total"
        />
        <StatCard
          label="Pending Prayers"
          value={loading ? '...' : data.pendingPrayers}
          icon={Heart}
          sub="Awaiting response"
        />
      </div>

      {/* Two-Column Section: Recent Conversations & Upcoming Events */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Recent Conversations */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-white/5">
            <h2 className="font-display font-semibold text-white text-xs sm:text-sm flex items-center gap-2">
              <MessageSquare size={17} className="text-gold" /> Recent Conversations
            </h2>
            <Link
              href="/conversations"
              className="text-xs text-gold hover:text-gold-light transition-colors flex items-center gap-1 group font-medium"
            >
              View all <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-8 text-center text-white/40 text-sm">Loading live conversations...</div>
            ) : data.recentConversations.length === 0 ? (
              <div className="px-5 py-8">
                <EmptyState
                  icon={MessageSquare}
                  title="No conversations yet"
                  description="Member WhatsApp messages will automatically show up here."
                />
              </div>
            ) : (
              data.recentConversations.map((conv: any) => {
                const member = Array.isArray(conv.members) ? conv.members[0] : conv.members;
                return (
                  <Link
                    key={conv.id}
                    href={`/conversations/${conv.id}`}
                    className="flex items-center gap-3.5 px-5 sm:px-6 py-3.5 table-row-hover group transition-colors block"
                  >
                    <div
                      className="w-9 sm:w-10 h-9 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold text-slate-950 flex-shrink-0 shadow-sm"
                      style={{ background: 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-gold-dark))' }}
                    >
                      {(member?.full_name ?? '?')[0]?.toUpperCase() ?? '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-gold transition-colors">
                        {member?.full_name ?? 'Unknown Contact'}
                      </p>
                      <p className="text-[11px] sm:text-xs text-white/40 truncate">{member?.phone}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full mb-1 ${
                          conv.status === 'open'
                            ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                            : 'bg-white/20'
                        }`}
                      />
                      <p className="text-[10px] text-white/40 block">
                        {conv.started_at ? format(parseISO(conv.started_at), 'MMM d') : ''}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Next Upcoming Service */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-white/5">
            <h2 className="font-display font-semibold text-white text-xs sm:text-sm flex items-center gap-2">
              <Calendar size={17} className="text-gold" /> Next Upcoming Service
            </h2>
            <Link
              href="/events"
              className="text-xs text-gold hover:text-gold-light transition-colors flex items-center gap-1 group font-medium"
            >
              All events <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="p-5 sm:p-6">
            {loading ? (
              <div className="text-center text-white/40 text-sm py-6">Loading next service...</div>
            ) : !data.nextService ? (
              <EmptyState
                icon={Calendar}
                title="No upcoming service found"
                description="Check back soon — weekly services are calculated automatically."
              />
            ) : (
              <div
                className="rounded-2xl p-5 sm:p-6 relative overflow-hidden"
                style={{
                  background: 'radial-gradient(ellipse at 80% 20%, oklch(0.78 0.16 75 / 0.12) 0%, oklch(0.11 0.04 265 / 0.70) 70%)',
                  border: '1px solid oklch(0.78 0.16 75 / 0.25)',
                }}
              >
                {/* Glow accent */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gold/8 blur-3xl pointer-events-none" />

                {/* Date Badge */}
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 shadow-gold"
                    style={{
                      background: 'linear-gradient(135deg, oklch(0.78 0.16 75), oklch(0.65 0.18 65))',
                    }}
                  >
                    <span className="text-slate-950 text-xl font-black leading-none">
                      {format(new Date(data.nextService.event_date + 'T12:00:00'), 'd')}
                    </span>
                    <span className="text-slate-900 text-[9px] uppercase font-bold tracking-wide leading-none mt-0.5">
                      {format(new Date(data.nextService.event_date + 'T12:00:00'), 'MMM')}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-white text-sm sm:text-base leading-tight">
                      {data.nextService.title}
                    </p>
                    {data.nextService.description && (
                      <p className="text-xs text-white/55 mt-1 leading-relaxed">
                        {data.nextService.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gold">
                        <Clock size={12} /> {data.nextService.start_time}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-white/40">
                        {format(new Date(data.nextService.event_date + 'T12:00:00'), 'EEEE, MMMM do')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
