import DashboardShell from '@/components/DashboardShell';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { ArrowLeft, Phone } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LiveReplyBox from '@/components/LiveReplyBox';
import ConversationThreadBox from '@/components/ConversationThreadBox';

async function getConversation(id: string) {
  const supabase = await createServerSupabaseClient();
  const [convRes, msgsRes] = await Promise.all([
    supabase
      .from('conversations')
      .select('id, status, channel, started_at, members(full_name, phone)')
      .eq('id', id)
      .single(),
    supabase
      .from('messages')
      .select('id, sender, message, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true }),
  ]);
  return { conv: convRes.data, messages: msgsRes.data ?? [] };
}

export default async function ConversationThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const { conv, messages } = await getConversation(resolvedParams.id);
  if (!conv) notFound();

  const member = Array.isArray(conv.members) ? conv.members[0] : conv.members;

  return (
    <DashboardShell>
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
        <Link href="/conversations" className="w-8 h-8 rounded-xl bg-navy-light/60 border border-white/8 flex items-center justify-center hover:bg-navy-mid transition-colors flex-shrink-0">
          <ArrowLeft size={15} className="text-white/50" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-lg sm:text-xl font-semibold text-white truncate">{member?.full_name ?? 'Unknown Member'}</h1>
          <p className="text-xs sm:text-sm text-white/35 flex items-center gap-1.5 mt-0.5 truncate">
            <Phone size={12} className="flex-shrink-0" />
            <span className="truncate">{member?.phone || 'No phone'}</span>
            <span>·</span>
            <span className="uppercase">{conv.channel}</span>
          </p>
        </div>
        <span className={`inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
          conv.status === 'open' ? 'pill-open' : 'pill-closed'
        }`}>
          {conv.status}
        </span>
      </div>

      {/* Message Thread Box with Auto-scroll & WhatsApp Double Ticks */}
      <ConversationThreadBox messages={messages} />

      {/* Live Staff WhatsApp Reply Box */}
      <LiveReplyBox
        conversationId={resolvedParams.id}
        memberPhone={member?.phone}
        memberName={member?.full_name}
      />

      {/* Stats bar */}
      <div className="mt-3 flex items-center gap-3 text-xs text-white/30 px-1">
        <span>{messages.length} total messages</span>
      </div>
    </DashboardShell>
  );
}
