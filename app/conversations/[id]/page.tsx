import DashboardShell from '@/components/DashboardShell';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { ArrowLeft, Clock, MessageSquare, Phone } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { notFound } from 'next/navigation';
import LiveReplyBox from '@/components/LiveReplyBox';

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
      <div className="flex items-center gap-4 mb-6">
        <Link href="/conversations" className="w-8 h-8 rounded-xl bg-navy-light/60 border border-white/8 flex items-center justify-center hover:bg-navy-mid transition-colors">
          <ArrowLeft size={15} className="text-white/50" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-xl font-semibold text-white">{member?.full_name ?? 'Unknown Member'}</h1>
          <p className="text-sm text-white/35 flex items-center gap-2 mt-0.5">
            <Phone size={12} /> {member?.phone || 'No phone'} · <span className="uppercase">{conv.channel}</span>
          </p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          conv.status === 'open' ? 'pill-open' : 'pill-closed'
        }`}>
          {conv.status}
        </span>
      </div>

      {/* Message Thread Box */}
      <div className="glass-card p-5 space-y-3 max-h-[60vh] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquare size={32} className="mx-auto text-white/20 mb-2" />
            <p className="text-white/30 text-sm">No messages in this conversation yet.</p>
          </div>
        ) : (
          messages.map((msg: any) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender === 'member' ? 'justify-start' : 'justify-end'
              } animate-fade-in`}
            >
              <div className={`max-w-[75%] ${
                msg.sender === 'member' ? 'bubble-member' : 'bubble-assistant'
              } px-4 py-2.5`}>
                <p className={`text-sm leading-relaxed ${
                  msg.sender === 'member' ? 'text-white/85' : 'text-gold-light'
                }`}>
                  {msg.message}
                </p>
                <p className={`text-[10px] mt-1 ${
                  msg.sender === 'member' ? 'text-white/25 text-left' : 'text-gold/40 text-right'
                } flex items-center gap-1 ${
                  msg.sender === 'assistant' ? 'justify-end' : ''
                }`}>
                  <Clock size={8} />
                  {msg.created_at ? format(parseISO(msg.created_at), 'MMM d, HH:mm') : ''}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Live Staff WhatsApp Reply Box */}
      <LiveReplyBox
        conversationId={resolvedParams.id}
        memberPhone={member?.phone}
        memberName={member?.full_name}
      />

      {/* Stats bar */}
      <div className="mt-3 flex items-center gap-4 text-xs text-white/30 px-1">
        <span>{messages.length} total messages</span>
        <span>·</span>
        <span>Started {conv.started_at ? format(parseISO(conv.started_at), 'MMM d, yyyy HH:mm') : '—'}</span>
      </div>
    </DashboardShell>
  );
}
