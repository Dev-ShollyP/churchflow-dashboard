'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { createClient } from '@/lib/supabase';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { format, parseISO, isAfter, startOfDay } from 'date-fns';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      const supabase = createClient();
      // Use local date string (browser's timezone) to filter past events
      const now = new Date();
      const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const { data } = await supabase
        .from('events')
        .select('id, title, description, event_date, start_time, end_time, location')
        .gte('event_date', localToday)
        .order('event_date', { ascending: true })
        .limit(50);

      setEvents(data ?? []);
      setLoading(false);
    }
    loadEvents();
  }, []);

  const today = startOfDay(new Date());
  const upcoming = events.filter((e: any) => isAfter(parseISO(e.event_date), today) || parseISO(e.event_date).getTime() === today.getTime()).length;

  return (
    <DashboardShell>
      <PageHeader
        title="Events & Programs"
        subtitle={loading ? 'Loading...' : `${upcoming} upcoming · ${events.length} total`}
      />

      {loading ? (
        <div className="glass-card p-10 text-center text-white/30 text-sm">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="glass-card p-10">
          <EmptyState icon={Calendar} title="No upcoming events" description="Past events are hidden. New events will appear here once added." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((event: any, idx: number) => (
            <div
              key={event.id}
              className="glass-card p-5 animate-slide-up"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {/* Date badge */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.2)' }}>
                  <span className="text-lg font-bold leading-none text-gold">
                    {format(parseISO(event.event_date), 'd')}
                  </span>
                  <span className="text-[9px] uppercase leading-none text-gold/60">
                    {format(parseISO(event.event_date), 'MMM')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-white text-sm leading-tight truncate">{event.title}</h3>
                  <p className="text-[10px] text-white/35 mt-0.5">{format(parseISO(event.event_date), 'EEEE, yyyy')}</p>
                </div>
              </div>

              {event.description && (
                <p className="text-xs text-white/45 leading-relaxed mb-3 line-clamp-2">{event.description}</p>
              )}

              <div className="space-y-1">
                {event.start_time && (
                  <p className="text-[11px] text-white/30 flex items-center gap-1.5">
                    <Clock size={10} className="text-gold/40" />
                    {event.start_time}{event.end_time ? ` – ${event.end_time}` : ''}
                  </p>
                )}
                {event.location && (
                  <p className="text-[11px] text-white/30 flex items-center gap-1.5">
                    <MapPin size={10} className="text-gold/40" />
                    {event.location}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
