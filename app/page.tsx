'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { createClient } from '@/lib/supabase';
import { Users, MessageSquare, Heart, Calendar, TrendingUp, Clock } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import { format, parseISO } from 'date-fns';

export default function OverviewPage() {
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

      const [membersRes, convsRes, msgsRes, prayersRes, eventsRes, recentConvsRes] = await Promise.all([
        supabase.from('members').select('id', { count: 'exact' }),
        supabase.from('conversations').select('id, status', { count: 'exact' }),
        supabase.from('messages').select('id', { count: 'exact' }),
        supabase.from('prayer_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('events').select('id, title, event_date, start_time').order('event_date', { ascending: true }).limit(5),
        supabase.from('conversations')
          .select('id, status, started_at, members(full_name, phone)')
          .order('started_at', { ascending: false })
          .limit(6),
      ]);

      const openConvs = convsRes.data?.filter(c => c.status === 'open').length ?? 0;

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

  const today = format(new Date(), 'EEEE, MMMM do yyyy');

  return (
    <DashboardShell>
      <PageHeader
        title="Overview"
        subtitle={today}
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
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
          sub={`${data.totalConversations} total`}
        />
        <StatCard
          label="Messages Sent"
          value={loading ? '...' : data.totalMessages.toLocaleString()}
          icon={TrendingUp}
          sub="All time"
        />
        <StatCard
          label="Pending Prayers"
          value={loading ? '...' : data.pendingPrayers}
          icon={Heart}
          sub="Awaiting response"
        />
      </div>

      {/* Two-column: Recent Convs + Upcoming Events */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Recent Conversations */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
            <h2 className="font-display font-semibold text-white text-sm">Recent Conversations</h2>
            <a href="/conversations" className="text-xs text-gold hover:text-gold-light transition-colors">View all →</a>
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
                  <a
                    key={conv.id}
                    href={`/conversations/${conv.id}`}
                    className="flex items-center gap-3 px-5 py-3 table-row-hover group"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-navy-dark flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6914)' }}>
                      {(member?.full_name ?? '?')[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{member?.full_name ?? 'Unknown'}</p>
                      <p className="text-xs text-white/30 truncate">{member?.phone}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mb-1 ${conv.status === 'open' ? 'bg-emerald-400' : 'bg-white/20'}`} />
                      <p className="text-[10px] text-white/25 block">
                        {conv.started_at ? format(parseISO(conv.started_at), 'MMM d') : ''}
                      </p>
                    </div>
                  </a>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
            <h2 className="font-display font-semibold text-white text-sm">Upcoming Events</h2>
            <a href="/events" className="text-xs text-gold hover:text-gold-light transition-colors">View all →</a>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-8 text-center text-white/30 text-sm">Loading upcoming events...</div>
            ) : data.upcomingEvents.length === 0 ? (
              <div className="px-5 py-8">
                <EmptyState icon={Calendar} title="No upcoming events" description="Events from the database will appear here." />
              </div>
            ) : (
              data.upcomingEvents.map((event: any) => (
                <div key={event.id} className="flex items-center gap-4 px-5 py-3 table-row-hover">
                  <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.2)' }}>
                    <span className="text-gold text-xs font-bold leading-none">
                      {event.event_date ? format(parseISO(event.event_date), 'd') : '?'}
                    </span>
                    <span className="text-gold/60 text-[9px] uppercase leading-none">
                      {event.event_date ? format(parseISO(event.event_date), 'MMM') : ''}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{event.title}</p>
                    {event.start_time && (
                      <p className="text-xs text-white/30 flex items-center gap-1">
                        <Clock size={10} /> {event.start_time}
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
