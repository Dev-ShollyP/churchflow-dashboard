'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { createClient, getCurrentStaff, StaffMember } from '@/lib/supabase';
import { Users, MessageSquare, Heart, Calendar, TrendingUp, Clock, ArrowRight, Sparkles, UploadCloud, MessageCircle } from 'lucide-react';
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
        supabase.from('events').select('id, title, event_date, start_time').gte('event_date', new Date().toISOString().slice(0, 10)).order('event_date', { ascending: true }).limit(5),
        supabase.from('conversations')
          .select('id, status, started_at, members(full_name, phone)')
          .order('started_at', { ascending: false })
          .limit(6),
      ]);

      const openConvs = convsRes.data?.filter(c => c.status === 'open').length ?? 0;

      setStaff(staffRes);
      setData({
        totalMembers: membersRes.count ?? membersRes.data?.length ?? 0,
        totalConversations: convsRes.count ?? convsRes.data?.length ?? 0,
        openConversations: openConvs,
        totalMessages: msgsRes.count ?? msgsRes.data?.length ?? 0,
        pendingPrayers: prayersRes.count ?? prayersRes.data?.length ?? 0,
        upcomingEvents: eventsRes.data ?? [],
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
      <div className="glass-card p-5 sm:p-6 md:p-8 mb-6 sm:mb-8 relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 80% 0%, rgba(201,168,76,0.15) 0%, rgba(15,27,56,0.7) 70%)' }}>
        
        {/* Glow effect */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gold/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-[11px] sm:text-xs font-semibold mb-2.5">
              <Sparkles size={12} />
              <span>Ogun Province 27 • Everflourishing Sanctuary</span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-semibold text-white leading-tight">
              Welcome back, <span className="text-gold-gradient">{greetingName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-white/50 mt-1">
              {todayStr} • Live WhatsApp &amp; Church management activity.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <Link
              href="/events/upload"
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-semibold btn-gold shadow-gold"
            >
              <UploadCloud size={15} />
              <span>Upload Flyer</span>
            </Link>
            <Link
              href="/conversations"
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-medium btn-glass"
            >
              <MessageCircle size={15} className="text-gold" />
              <span>WhatsApp Chats</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          label="Total Members"
          value={loading ? '...' : data.totalMembers}
          icon={Users}
          sub="WhatsApp contacts"
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

      {/* Two-column: Recent Convs + Upcoming Events */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">

        {/* Recent Conversations */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/6">
            <h2 className="font-display font-semibold text-white text-xs sm:text-sm flex items-center gap-2">
              <MessageSquare size={16} className="text-gold" /> Recent Conversations
            </h2>
            <Link href="/conversations" className="text-xs text-gold hover:text-gold-light transition-colors flex items-center gap-1 group">
              View all <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-8 text-center text-white/30 text-sm">Loading conversations...</div>
            ) : data.recentConversations.length === 0 ? (
              <div className="px-5 py-8">
                <EmptyState icon={MessageSquare} title="No conversations yet" description="Conversations will appear here as members message the bot." />
              </div>
            ) : (
              data.recentConversations.map((conv: any) => {
                const member = Array.isArray(conv.members) ? conv.members[0] : conv.members;
                return (
                  <Link
                    key={conv.id}
                    href={`/conversations/${conv.id}`}
                    className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-3.5 table-row-hover group transition-colors block"
                  >
                    <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-full flex items-center justify-center text-xs font-semibold text-navy-dark flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6914)' }}>
                      {(member?.full_name ?? '?')[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-white truncate group-hover:text-gold transition-colors">
                        {member?.full_name ?? 'Unknown Contact'}
                      </p>
                      <p className="text-[11px] sm:text-xs text-white/35 truncate">{member?.phone}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`inline-block w-2 h-2 rounded-full mb-1 ${conv.status === 'open' ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-white/20'}`} />
                      <p className="text-[10px] text-white/30 block">
                        {conv.started_at ? format(parseISO(conv.started_at), 'MMM d') : ''}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/6">
            <h2 className="font-display font-semibold text-white text-xs sm:text-sm flex items-center gap-2">
              <Calendar size={16} className="text-gold" /> Upcoming Events &amp; Programs
            </h2>
            <Link href="/events" className="text-xs text-gold hover:text-gold-light transition-colors flex items-center gap-1 group">
              View all <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-8 text-center text-white/30 text-sm">Loading upcoming events...</div>
            ) : data.upcomingEvents.length === 0 ? (
              <div className="px-5 py-8">
                <EmptyState icon={Calendar} title="No upcoming events" description="Events created in the database will appear here." />
              </div>
            ) : (
              data.upcomingEvents.map((event: any) => (
                <div key={event.id} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-3.5 table-row-hover">
                  <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.2)' }}>
                    <span className="text-gold text-xs font-bold leading-none">
                      {event.event_date ? format(parseISO(event.event_date), 'd') : '?'}
                    </span>
                    <span className="text-gold/60 text-[9px] uppercase leading-none mt-0.5">
                      {event.event_date ? format(parseISO(event.event_date), 'MMM') : ''}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-white truncate">{event.title}</p>
                    {event.start_time && (
                      <p className="text-[11px] sm:text-xs text-white/35 flex items-center gap-1.5 mt-0.5">
                        <Clock size={11} className="text-gold/50" /> {event.start_time}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </DashboardShell>
  );
}
