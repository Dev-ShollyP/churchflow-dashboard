import DashboardShell from '@/components/DashboardShell';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import Pill from '@/components/ui/Pill';
import { MessageSquare, Clock } from 'lucide-react';
import { parseISO, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

async function getConversations() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('conversations')
    .select('id, status, channel, started_at, members(full_name, phone)')
    .order('started_at', { ascending: false })
    .limit(80);
  return data ?? [];
}

export default async function ConversationsPage() {
  const conversations = await getConversations();
  const open = conversations.filter((c: any) => c.status === 'open').length;

  return (
    <DashboardShell>
      <PageHeader
        title="Conversations"
        subtitle={`${open} open · ${conversations.length} total`}
      />

      <div className="glass-card overflow-hidden">
        {conversations.length === 0 ? (
          <div className="p-10">
            <EmptyState icon={MessageSquare} title="No conversations" description="WhatsApp conversations will appear here." />
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {conversations.map((conv: any, idx: number) => {
              const member = Array.isArray(conv.members) ? conv.members[0] : conv.members;
              return (
                <Link
                  key={conv.id}
                  href={`/conversations/${conv.id}`}
                  className="flex items-center gap-4 px-5 py-4 table-row-hover group animate-fade-in"
                  style={{ animationDelay: `${idx * 15}ms`, display: 'flex' }}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-navy-dark flex-shrink-0 group-hover:scale-105 transition-transform"
                    style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6914)' }}>
                    {(member?.full_name ?? '?')[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm group-hover:text-gold-light transition-colors">
                      {member?.full_name ?? 'Unknown Member'}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5 flex items-center gap-1">
                      <Clock size={10} />
                      {conv.started_at
                        ? formatDistanceToNow(parseISO(conv.started_at), { addSuffix: true })
                        : '—'}
                      &nbsp;·&nbsp;{member?.phone}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Pill
                      label={conv.status === 'open' ? 'Open' : conv.status === 'closed' ? 'Closed' : conv.status}
                      variant={conv.status === 'open' ? 'open' : 'closed'}
                    />
                    <span className="text-[10px] text-white/20 uppercase tracking-wide">{conv.channel}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
