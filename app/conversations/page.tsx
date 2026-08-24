'use client';

import { useState, useEffect, useMemo } from 'react';
import DashboardShell from '@/components/DashboardShell';
import { createClient } from '@/lib/supabase';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import {
  MessageSquare, Search, CheckCheck,
  AlertCircle, CheckCircle2
} from 'lucide-react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import Link from 'next/link';

interface ConversationItem {
  id: string;
  status: string;
  channel: string;
  started_at: string;
  member: {
    id?: string;
    full_name: string;
    phone: string;
  };
  lastMessage?: {
    id: string;
    sender: 'member' | 'assistant' | 'staff';
    message: string;
    created_at: string;
  };
  unreadCount: number;
  isHumanRequest: boolean;
}

const READ_CONVERSATIONS_KEY = 'churchflow_read_conv_timestamps_v1';
const RESOLVED_HUMAN_REQUESTS_KEY = 'churchflow_resolved_human_requests_v1';

function getReadTimestamps(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(READ_CONVERSATIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getResolvedHumanRequests(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(RESOLVED_HUMAN_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function markConversationAsReadInStorage(convId: string, timestampISO?: string) {
  if (typeof window === 'undefined') return;
  try {
    const nowISO = timestampISO || new Date().toISOString();
    
    // 1. Mark read timestamp
    const readMap = getReadTimestamps();
    readMap[convId] = nowISO;
    localStorage.setItem(READ_CONVERSATIONS_KEY, JSON.stringify(readMap));

    // 2. Mark human request resolved
    const resolvedMap = getResolvedHumanRequests();
    resolvedMap[convId] = nowISO;
    localStorage.setItem(RESOLVED_HUMAN_REQUESTS_KEY, JSON.stringify(resolvedMap));

    // 3. Clear header notifications
    const rawNotifs = localStorage.getItem('churchflow_notifications_v2');
    if (rawNotifs) {
      const notifs = JSON.parse(rawNotifs);
      const filtered = notifs.filter((n: any) => n.conversationId !== convId);
      localStorage.setItem('churchflow_notifications_v2', JSON.stringify(filtered));
    }

    window.dispatchEvent(new Event('storage'));
  } catch {}
}

function formatWhatsAppTime(dateString?: string) {
  if (!dateString) return '';
  try {
    const d = parseISO(dateString);
    if (isToday(d)) {
      return format(d, 'h:mm a');
    }
    if (isYesterday(d)) {
      return 'Yesterday';
    }
    return format(d, 'MMM d');
  } catch {
    return '';
  }
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'human' | 'open' | 'closed'>('all');

  const supabase = useMemo(() => createClient(), []);

  const fetchConversationsData = async () => {
    try {
      // 1. Fetch conversations with members
      const { data: convs, error: convError } = await supabase
        .from('conversations')
        .select('id, status, channel, started_at, members(id, full_name, phone)')
        .order('started_at', { ascending: false })
        .limit(100);

      if (convError || !convs) {
        setLoading(false);
        return;
      }

      // 2. Fetch latest messages for each conversation
      const convIds = convs.map(c => c.id);
      let messageMap: Record<string, { lastMessage: any; unreadCount: number; isHumanRequest: boolean }> = {};

      if (convIds.length > 0) {
        const { data: messages } = await supabase
          .from('messages')
          .select('id, conversation_id, sender, message, created_at')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: false });

        const readMap = getReadTimestamps();
        const resolvedMap = getResolvedHumanRequests();

        if (messages) {
          messages.forEach(m => {
            if (!messageMap[m.conversation_id]) {
              messageMap[m.conversation_id] = {
                lastMessage: m,
                unreadCount: 0,
                isHumanRequest: false,
              };
            }

            const readAfter = readMap[m.conversation_id] ? new Date(readMap[m.conversation_id]).getTime() : 0;
            const resolvedAfter = resolvedMap[m.conversation_id] ? new Date(resolvedMap[m.conversation_id]).getTime() : 0;
            const msgTime = new Date(m.created_at).getTime();

            // Count unread incoming member messages
            if (m.sender === 'member' && msgTime > readAfter) {
              messageMap[m.conversation_id].unreadCount += 1;
            }

            // Check for unhandled human assistance triggers:
            // Must be sent by member AFTER the last read/resolved time
            if (
              m.sender === 'member' &&
              msgTime > readAfter &&
              msgTime > resolvedAfter &&
              /pastor|human|talk|speak|help|counsel|prayer|urgent|deacon/i.test(m.message || '')
            ) {
              messageMap[m.conversation_id].isHumanRequest = true;
            }
          });
        }
      }

      const formatted: ConversationItem[] = convs.map((c: any) => {
        const member = Array.isArray(c.members) ? c.members[0] : c.members;
        const msgInfo = messageMap[c.id];

        return {
          id: c.id,
          status: c.status,
          channel: c.channel,
          started_at: c.started_at,
          member: {
            id: member?.id,
            full_name: member?.full_name || 'WhatsApp Visitor',
            phone: member?.phone || 'No phone',
          },
          lastMessage: msgInfo?.lastMessage,
          unreadCount: msgInfo?.unreadCount ?? 0,
          isHumanRequest: (msgInfo?.isHumanRequest ?? false) && c.status === 'open',
        };
      });

      // Sort: Conversations with recent activity first
      formatted.sort((a, b) => {
        const timeA = new Date(a.lastMessage?.created_at || a.started_at).getTime();
        const timeB = new Date(b.lastMessage?.created_at || b.started_at).getTime();
        return timeB - timeA;
      });

      setConversations(formatted);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversationsData();

    // Listen to local storage changes from conversation thread page
    const handleStorage = () => {
      fetchConversationsData();
    };
    window.addEventListener('storage', handleStorage);

    // Realtime listener for incoming messages
    const channel = supabase
      .channel('conversations_realtime_list_v2')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          fetchConversationsData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          fetchConversationsData();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('storage', handleStorage);
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleMarkAllAsRead = () => {
    const nowISO = new Date().toISOString();
    conversations.forEach(c => {
      markConversationAsReadInStorage(c.id, nowISO);
    });
    setConversations(prev => prev.map(c => ({ ...c, unreadCount: 0, isHumanRequest: false })));
  };

  const handleResolveAllHuman = () => {
    const nowISO = new Date().toISOString();
    conversations.forEach(c => {
      if (c.isHumanRequest) {
        markConversationAsReadInStorage(c.id, nowISO);
      }
    });
    setConversations(prev => prev.map(c => ({ ...c, isHumanRequest: false })));
  };

  const handleOpenConversation = (convId: string, latestMsgTime?: string) => {
    markConversationAsReadInStorage(convId, latestMsgTime || new Date().toISOString());
    setConversations(prev =>
      prev.map(c => (c.id === convId ? { ...c, unreadCount: 0, isHumanRequest: false } : c))
    );
  };

  const handleResolveSingleHuman = (convId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markConversationAsReadInStorage(convId);
    setConversations(prev =>
      prev.map(c => (c.id === convId ? { ...c, isHumanRequest: false, unreadCount: 0 } : c))
    );
  };

  const totalUnread = useMemo(() => {
    return conversations.filter(c => c.unreadCount > 0).length;
  }, [conversations]);

  const humanHelpCount = useMemo(() => {
    return conversations.filter(c => c.isHumanRequest && c.status === 'open').length;
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    let list = [...conversations];

    // Filter tab
    if (activeFilter === 'unread') {
      list = list.filter(c => c.unreadCount > 0);
    } else if (activeFilter === 'human') {
      list = list.filter(c => c.isHumanRequest);
    } else if (activeFilter === 'open') {
      list = list.filter(c => c.status === 'open');
    } else if (activeFilter === 'closed') {
      list = list.filter(c => c.status === 'closed');
    }

    // Search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        c =>
          c.member.full_name.toLowerCase().includes(q) ||
          c.member.phone.toLowerCase().includes(q) ||
          (c.lastMessage?.message && c.lastMessage.message.toLowerCase().includes(q))
      );
    }

    return list;
  }, [conversations, activeFilter, searchQuery]);

  return (
    <DashboardShell>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <PageHeader
          title="Live Conversations"
          subtitle={`${conversations.filter(c => c.status === 'open').length} active threads • Real-time WhatsApp sync`}
        />

        <div className="flex items-center gap-2 flex-wrap">
          {totalUnread > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="self-start md:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold/10 hover:bg-gold/20 border border-gold/30 text-gold text-xs font-semibold transition-all shadow-sm"
            >
              <CheckCircle2 size={14} />
              <span>Mark All as Read ({totalUnread})</span>
            </button>
          )}

          {humanHelpCount > 0 && (
            <button
              onClick={handleResolveAllHuman}
              className="self-start md:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-semibold transition-all shadow-sm"
            >
              <CheckCircle2 size={14} />
              <span>Resolve All Pastor Requests ({humanHelpCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Search & Filter Tabs */}
      <div className="glass-card p-3 sm:p-4 mb-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by member name, phone, or chat message..."
            style={{ backgroundColor: '#091124', color: '#ffffff' }}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm text-white placeholder-white/40 border border-white/10 focus:border-gold/60 focus:outline-none transition-all"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none flex-wrap">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'all'
                ? 'bg-gold text-slate-950 shadow-gold'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            All ({conversations.length})
          </button>

          <button
            onClick={() => setActiveFilter('unread')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeFilter === 'unread'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/30'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Unread</span>
            {totalUnread > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeFilter === 'unread' ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500 text-slate-950'
              }`}>
                {totalUnread}
              </span>
            )}
          </button>

          {humanHelpCount > 0 && (
            <button
              onClick={() => setActiveFilter('human')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeFilter === 'human'
                  ? 'bg-red-500 text-white font-bold shadow-lg shadow-red-500/30'
                  : 'bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30'
              }`}
            >
              <span>🚨 Needs Pastor ({humanHelpCount})</span>
            </button>
          )}

          <button
            onClick={() => setActiveFilter('open')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'open'
                ? 'bg-gold text-slate-950 shadow-gold'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            Open
          </button>

          <button
            onClick={() => setActiveFilter('closed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'closed'
                ? 'bg-gold text-slate-950 shadow-gold'
                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            Closed
          </button>
        </div>
      </div>

      {/* Conversation List Surface */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-white/40 text-sm">
            <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin mx-auto mb-3" />
            <span>Loading WhatsApp conversations...</span>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 sm:p-12">
            <EmptyState
              icon={MessageSquare}
              title={searchQuery ? 'No matching conversations' : 'No conversations found'}
              description={searchQuery ? 'Try clearing your search term.' : 'Member WhatsApp messages will automatically appear here in real-time.'}
            />
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredConversations.map((conv, idx) => {
              const hasUnread = conv.unreadCount > 0;
              const lastMsg = conv.lastMessage;
              const isOutbound = lastMsg && (lastMsg.sender === 'assistant' || lastMsg.sender === 'staff');
              const displayTime = formatWhatsAppTime(lastMsg?.created_at || conv.started_at);

              return (
                <Link
                  key={conv.id}
                  href={`/conversations/${conv.id}`}
                  onClick={() => handleOpenConversation(conv.id, lastMsg?.created_at)}
                  className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 transition-all duration-150 group relative block ${
                    hasUnread
                      ? 'bg-emerald-500/[0.07] hover:bg-emerald-500/[0.12] border-l-4 border-l-emerald-400'
                      : 'table-row-hover'
                  }`}
                  style={{ animationDelay: `${idx * 15}ms` }}
                >
                  {/* Avatar with unread indicator badge */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-10 sm:w-11 h-10 sm:h-11 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-slate-950 shadow-md group-hover:scale-105 transition-transform"
                      style={{
                        background: hasUnread
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-gold-dark))',
                      }}
                    >
                      {(conv.member.full_name || '?')[0].toUpperCase()}
                    </div>

                    {/* WhatsApp Green Live Pulse on Avatar */}
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-slate-900" />
                      </span>
                    )}
                  </div>

                  {/* Main Chat Info */}
                  <div className="flex-1 min-w-0">
                    {/* Top Row: Name + Badges + Time */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className={`text-xs sm:text-sm truncate transition-colors ${
                          hasUnread
                            ? 'font-bold text-white group-hover:text-emerald-300'
                            : 'font-medium text-white/90 group-hover:text-gold'
                        }`}>
                          {conv.member.full_name}
                        </p>

                        {conv.isHumanRequest && (
                          <button
                            onClick={(e) => handleResolveSingleHuman(conv.id, e)}
                            title="Click to resolve and clear Needs Pastor badge"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/20 hover:bg-red-500/40 border border-red-500/40 text-red-300 flex-shrink-0 animate-pulse transition-all cursor-pointer group/btn"
                          >
                            <AlertCircle size={10} />
                            <span>Needs Pastor</span>
                            <span className="opacity-70 group-hover/btn:opacity-100 hover:text-white font-normal ml-0.5">✕</span>
                          </button>
                        )}
                      </div>

                      {/* Message Time */}
                      <span className={`text-[10px] sm:text-xs flex-shrink-0 ${
                        hasUnread ? 'text-emerald-400 font-bold' : 'text-white/40'
                      }`}>
                        {displayTime}
                      </span>
                    </div>

                    {/* Bottom Row: Message Snippet + Unread Counter */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {isOutbound && (
                          <span className="text-[#53bdeb] flex-shrink-0" title="Delivered">
                            <CheckCheck size={14} className="text-[#53bdeb]" />
                          </span>
                        )}

                        <p className={`text-xs truncate ${
                          hasUnread
                            ? 'text-white font-semibold'
                            : 'text-white/50 group-hover:text-white/70'
                        }`}>
                          {lastMsg?.message || `Conversation started · ${conv.member.phone}`}
                        </p>
                      </div>

                      {/* WhatsApp Green Unread Counter Bubble */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {hasUnread ? (
                          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-lg shadow-emerald-500/40">
                            {conv.unreadCount}
                          </span>
                        ) : (
                          <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded-md font-semibold ${
                            conv.status === 'open'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-white/5 text-white/30 border border-white/5'
                          }`}>
                            {conv.status}
                          </span>
                        )}
                      </div>
                    </div>
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
