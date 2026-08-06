import DashboardShell from '@/components/DashboardShell';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import Pill from '@/components/ui/Pill';
import { Heart, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

async function getPrayers() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('prayer_requests')
    .select('id, request_text, status, created_at, members(full_name, phone)')
    .order('created_at', { ascending: false })
    .limit(80);
  return data ?? [];
}

export default async function PrayersPage() {
  const prayers = await getPrayers();
  const pending = prayers.filter((p: any) => p.status === 'pending').length;

  return (
    <DashboardShell>
      <PageHeader
        title="Prayer Requests"
        subtitle={`${pending} pending · ${prayers.length} total`}
      />

      <div className="glass-card overflow-hidden">
        {prayers.length === 0 ? (
          <div className="p-10">
            <EmptyState icon={Heart} title="No prayer requests" description="Prayer requests from members will appear here." />
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {prayers.map((prayer: any, idx: number) => {
              const member = Array.isArray(prayer.members) ? prayer.members[0] : prayer.members;
              return (
                <div key={prayer.id} className="px-5 py-4 table-row-hover animate-fade-in" style={{ animationDelay: `${idx * 15}ms` }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-navy-dark flex-shrink-0 mt-0.5"
                        style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6914)' }}>
                        {(member?.full_name ?? '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{member?.full_name ?? 'Unknown'}</p>
                        <p className="text-xs text-white/30 mb-2">{member?.phone}</p>
                        <p className="text-sm text-white/70 leading-relaxed">{prayer.request_text}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <Pill
                        label={prayer.status === 'answered' ? 'Answered' : 'Pending'}
                        variant={prayer.status === 'answered' ? 'answered' : 'pending'}
                      />
                      <span className="text-[10px] text-white/20 flex items-center gap-1">
                        <Clock size={9} />
                        {prayer.created_at ? format(parseISO(prayer.created_at), 'MMM d') : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
