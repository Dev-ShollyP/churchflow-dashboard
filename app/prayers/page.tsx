'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Heart, Clock, MessageSquare, CheckCircle2, Phone, Search, Filter } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

interface PrayerItem {
  id: string;
  request_text: string;
  status: 'pending' | 'answered' | string;
  created_at: string;
  conversation_id?: string;
  member_name: string;
  member_phone: string;
  source: 'prayer_table' | 'message';
}

export default function PrayersPage() {
  const [prayers, setPrayers] = useState<PrayerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'answered'>('all');

  const fetchPrayers = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Fetch explicit rows from `prayer_requests` table
      const { data: explicitData } = await supabase
        .from('prayer_requests')
        .select('id, request_text, status, created_at, member_id, members(full_name, phone)')
        .order('created_at', { ascending: false })
        .limit(100);

      // 2. Fetch member messages that contain prayer-related keywords
      const { data: messageData } = await supabase
        .from('messages')
        .select('id, message, created_at, conversation_id, conversations(id, members(full_name, phone))')
        .eq('sender', 'member')
        .order('created_at', { ascending: false })
        .limit(150);

      const items: PrayerItem[] = [];
      const seenTexts = new Set<string>();

      // Process explicit prayer_requests rows
      if (explicitData) {
        explicitData.forEach((p: any) => {
          const member = Array.isArray(p.members) ? p.members[0] : p.members;
          const cleanText = (p.request_text || '').trim();
          if (cleanText) {
            seenTexts.add(cleanText.toLowerCase());
            items.push({
              id: p.id,
              request_text: cleanText,
              status: p.status || 'pending',
              created_at: p.created_at,
              member_name: member?.full_name || 'Member',
              member_phone: member?.phone || 'No phone',
              source: 'prayer_table',
            });
          }
        });
      }

      // Process inbound messages matching prayer keywords
      if (messageData) {
        messageData.forEach((m: any) => {
          const text = (m.message || '').trim();
          const lower = text.toLowerCase();
          const isPrayer = /pray|prayer|intercede|mountain|pastor|deliverance|healing|request|god|blessing|amen/i.test(lower);

          if (isPrayer && !seenTexts.has(lower)) {
            seenTexts.add(lower);
            const conv = Array.isArray(m.conversations) ? m.conversations[0] : m.conversations;
            const member = conv ? (Array.isArray(conv.members) ? conv.members[0] : conv.members) : null;

            items.push({
              id: m.id,
              request_text: text,
              status: 'pending',
              created_at: m.created_at,
              conversation_id: m.conversation_id || conv?.id,
              member_name: member?.full_name || 'WhatsApp Member',
              member_phone: member?.phone || 'WhatsApp Contact',
              source: 'message',
            });
          }
        });
      }

      // Sort by created_at descending
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPrayers(items);
    } catch (e) {
      console.error('Error fetching prayer requests:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrayers();
  }, []);

  const handleToggleStatus = async (item: PrayerItem) => {
    setUpdatingId(item.id);
    const newStatus = item.status === 'answered' ? 'pending' : 'answered';

    try {
      await fetch('/api/prayers/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prayer_id: item.source === 'prayer_table' ? item.id : null,
          request_text: item.request_text,
          status: newStatus,
          member_phone: item.member_phone,
        }),
      });

      setPrayers(prev =>
        prev.map(p => (p.id === item.id ? { ...p, status: newStatus } : p))
      );
    } catch (e) {
      console.error('Failed to update status:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = prayers.filter(p => {
    const matchesSearch =
      p.request_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.member_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.member_phone.includes(searchQuery);

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = prayers.filter(p => p.status === 'pending').length;

  return (
    <DashboardShell>
      <PageHeader
        title="Prayer Requests"
        subtitle={`${pendingCount} pending prayer requests · ${prayers.length} total captured from WhatsApp`}
      />

      {/* Search & Status Filter Bar */}
      <div className="glass-card p-3.5 sm:p-4 mb-5 sm:mb-6 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prayer requests by keyword, member name, or phone..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm text-white placeholder-white/30 bg-navy-dark/60 border border-white/10 focus:border-gold/50 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-[11px] sm:text-xs font-semibold text-white/40 flex items-center gap-1 mr-0.5 flex-shrink-0">
            <Filter size={12} /> Filter:
          </span>
          {(['all', 'pending', 'answered'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold capitalize transition-all flex-shrink-0 ${
                statusFilter === st
                  ? 'bg-gold text-navy-dark shadow-gold'
                  : 'bg-navy-dark/60 text-white/60 border border-white/8 hover:text-white hover:bg-white/5'
              }`}
            >
              {st} ({st === 'all' ? prayers.length : st === 'pending' ? pendingCount : prayers.length - pendingCount})
            </button>
          ))}
        </div>
      </div>

      {/* Prayer List Container */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-white/30 text-sm">Loading prayer requests...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 sm:p-10">
            <EmptyState
              icon={Heart}
              title="No prayer requests found"
              description="Prayer requests sent by members via WhatsApp will automatically appear here."
            />
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((prayer, idx) => (
              <div
                key={prayer.id}
                className="p-4 sm:p-5 table-row-hover animate-fade-in transition-colors"
                style={{ animationDelay: `${idx * 20}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-navy-dark flex-shrink-0 mt-0.5"
                      style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6914)' }}
                    >
                      {(prayer.member_name || '?')[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-sm sm:text-base">
                          {prayer.member_name}
                        </span>
                        <span className="text-xs text-white/40 flex items-center gap-1">
                          <Phone size={11} /> {prayer.member_phone}
                        </span>
                      </div>

                      {/* Request Text */}
                      <p className="text-xs sm:text-sm text-gold-light/90 leading-relaxed mt-1.5 p-3 rounded-xl bg-black/30 border border-white/5 whitespace-pre-wrap">
                        "{prayer.request_text}"
                      </p>

                      {/* Metadata & Actions */}
                      <div className="flex items-center gap-4 mt-2.5 text-[11px] text-white/35 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {prayer.created_at ? format(parseISO(prayer.created_at), 'MMM d, yyyy · HH:mm') : ''}
                        </span>

                        {prayer.conversation_id && (
                          <Link
                            href={`/conversations/${prayer.conversation_id}`}
                            className="text-gold hover:underline font-medium flex items-center gap-1"
                          >
                            <MessageSquare size={11} /> Open WhatsApp Chat
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Toggle Button */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleStatus(prayer)}
                      disabled={updatingId === prayer.id}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        prayer.status === 'answered'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-gold/15 text-gold border-gold/30 hover:bg-gold/25'
                      }`}
                    >
                      <CheckCircle2 size={13} />
                      <span>{prayer.status === 'answered' ? 'Answered' : 'Mark Answered'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
