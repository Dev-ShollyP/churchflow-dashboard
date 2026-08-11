'use client';

import { useEffect, useRef, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Heart, Clock, MessageSquare, CheckCircle2, Phone, Search, Filter, RotateCcw } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'answered'>('pending');
  const [isAnsweredFolded, setIsAnsweredFolded] = useState(true);

  // Local status overrides — survives fetchPrayers() calls.
  // Stores status set by user clicks so refetches don't wipe them.
  const localStatusOverrides = useRef<Map<string, 'pending' | 'answered'>>(new Map());

  const fetchPrayers = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    const supabase = createClient();

    try {
      const { data: explicitData } = await supabase
        .from('prayer_requests')
        .select('id, request, request_text, status, answered, created_at, member_id, members(full_name, phone)')
        .order('created_at', { ascending: false })
        .limit(100);

      const { data: messageData } = await supabase
        .from('messages')
        .select('id, message, created_at, conversation_id, conversations(id, members(full_name, phone))')
        .eq('sender', 'member')
        .order('created_at', { ascending: false })
        .limit(150);

      const items: PrayerItem[] = [];
      const seenTexts = new Set<string>();

      if (explicitData) {
        explicitData.forEach((p: any) => {
          const member = Array.isArray(p.members) ? p.members[0] : p.members;
          const cleanText = (p.request || p.request_text || '').trim();
          if (cleanText) {
            seenTexts.add(cleanText.toLowerCase());
            const isAns = p.status === 'answered' || p.status === 'completed' || p.answered === true;
            items.push({
              id: p.id,
              request_text: cleanText,
              status: isAns ? 'answered' : 'pending',
              created_at: p.created_at,
              member_name: member?.full_name || 'Member',
              member_phone: member?.phone || 'No phone',
              source: 'prayer_table',
            });
          }
        });
      }

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

      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Apply any local user overrides on top of server data
      const overrides = localStatusOverrides.current;
      if (overrides.size > 0) {
        items.forEach(item => {
          if (overrides.has(item.id)) {
            item.status = overrides.get(item.id)!;
          }
        });
      }

      setPrayers(items);
    } catch (e) {
      console.error('Error fetching prayer requests:', e);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrayers(true);
  }, []);

  const handleToggleStatus = async (item: PrayerItem) => {
    if (updatingId === item.id) return; // prevent double-click
    setUpdatingId(item.id);
    const newStatus = item.status === 'answered' ? 'pending' : 'answered';

    // 1. Save override so future fetchPrayers() calls respect this choice
    localStatusOverrides.current.set(item.id, newStatus);

    // 2. Optimistically update local React state immediately (instant UI)
    setPrayers(prev =>
      prev.map(p => (p.id === item.id ? { ...p, status: newStatus } : p))
    );

    try {
      const res = await fetch('/api/prayers/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prayer_id: item.source === 'prayer_table' ? item.id : null,
          request_text: item.request_text,
          status: newStatus,
          member_phone: item.member_phone,
        }),
      });

      if (!res.ok) {
        // Rollback override and optimistic update if server fails
        localStatusOverrides.current.set(item.id, item.status as 'pending' | 'answered');
        setPrayers(prev =>
          prev.map(p => (p.id === item.id ? { ...p, status: item.status } : p))
        );
        console.error('Server failed to save prayer status');
      }
      // ✅ Do NOT call fetchPrayers() here — RLS blocks client reads
      // The optimistic state + localStatusOverrides keeps UI correct
    } catch (e) {
      // Rollback
      localStatusOverrides.current.set(item.id, item.status as 'pending' | 'answered');
      setPrayers(prev =>
        prev.map(p => (p.id === item.id ? { ...p, status: item.status } : p))
      );
      console.error('Failed to update status:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingPrayersAll = prayers.filter(p => p.status === 'pending');
  const answeredPrayersAll = prayers.filter(p => p.status === 'answered');

  const pendingPrayers = pendingPrayersAll.filter(p =>
    p.request_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.member_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.member_phone.includes(searchQuery)
  );

  const answeredPrayers = answeredPrayersAll.filter(p =>
    p.request_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.member_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.member_phone.includes(searchQuery)
  );

  return (
    <DashboardShell>
      <PageHeader
        title="Prayer Requests Wall"
        subtitle={`${pendingPrayersAll.length} pending prayer requests · ${prayers.length} total captured from WhatsApp`}
      />

      {/* Search & Status Filter Bar */}
      <div className="glass-card p-3.5 sm:p-4 mb-5 sm:mb-6 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prayer requests by keyword, member name, or phone..."
            style={{ backgroundColor: '#091124', color: '#ffffff' }}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm text-white placeholder-white/40 border border-white/15 focus:border-gold/50 focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-[11px] sm:text-xs font-semibold text-white/40 flex items-center gap-1 mr-0.5 flex-shrink-0">
            <Filter size={12} /> Filter:
          </span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold capitalize transition-all flex-shrink-0 cursor-pointer ${
              statusFilter === 'all'
                ? 'btn-gold shadow-gold'
                : 'bg-white/5 text-white/60 border border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            All ({prayers.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold capitalize transition-all flex-shrink-0 cursor-pointer ${
              statusFilter === 'pending'
                ? 'btn-gold shadow-gold'
                : 'bg-white/5 text-white/60 border border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            Pending ({pendingPrayersAll.length})
          </button>
          <button
            onClick={() => setStatusFilter('answered')}
            className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold capitalize transition-all flex-shrink-0 cursor-pointer ${
              statusFilter === 'answered'
                ? 'btn-gold shadow-gold'
                : 'bg-white/5 text-white/60 border border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            Answered ({answeredPrayersAll.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-white/40 text-sm">Loading prayer requests...</div>
      ) : (
        <div className="space-y-6">

          {/* SECTION 1: Active / Pending Prayer Requests */}
          {(statusFilter === 'all' || statusFilter === 'pending') && (
            <div className="glass-card overflow-hidden border border-gold/30 shadow-xl">
              <div className="px-5 py-3.5 bg-gold/10 border-b border-gold/20 flex items-center justify-between">
                <h3 className="font-display font-semibold text-gold text-xs sm:text-sm flex items-center gap-2">
                  <Heart size={16} /> Active Pending Prayer Requests ({pendingPrayers.length})
                </h3>
                <span className="text-[11px] text-white/50">Requires Intercession &amp; Pastoral Follow-up</span>
              </div>

              {pendingPrayers.length === 0 ? (
                <div className="p-8 text-center text-xs text-white/40">
                  🎉 No pending prayer requests in this view.
                  {answeredPrayersAll.length > 0 && statusFilter === 'pending' && (
                    <button
                      onClick={() => setStatusFilter('answered')}
                      className="ml-2 text-gold underline font-semibold hover:text-gold-light cursor-pointer"
                    >
                      View Answered Prayers ({answeredPrayersAll.length})
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {pendingPrayers.map((prayer, idx) => (
                    <div
                      key={prayer.id}
                      className="p-4 sm:p-5 table-row-hover animate-fade-in transition-colors"
                      style={{ animationDelay: `${idx * 20}ms` }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div
                            className="w-9 sm:w-10 h-9 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold text-slate-950 flex-shrink-0 mt-0.5 shadow-sm"
                            style={{ background: 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-gold-dark))' }}
                          >
                            {(prayer.member_name || '?')[0]?.toUpperCase()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-white text-sm sm:text-base">
                                {prayer.member_name}
                              </span>
                              <span className="text-xs text-white/40 flex items-center gap-1">
                                <Phone size={12} className="text-gold/60" /> {prayer.member_phone}
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm text-gold-light/95 leading-relaxed mt-2 p-3.5 rounded-xl bg-black/40 border border-white/8 whitespace-pre-wrap">
                              "{prayer.request_text}"
                            </p>

                            <div className="flex items-center gap-4 mt-2.5 text-[11px] text-white/40 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {prayer.created_at ? format(parseISO(prayer.created_at), 'MMM d, yyyy · HH:mm') : ''}
                              </span>

                              {prayer.conversation_id && (
                                <Link
                                  href={`/conversations/${prayer.conversation_id}`}
                                  className="text-gold hover:underline font-semibold flex items-center gap-1"
                                >
                                  <MessageSquare size={12} /> Open WhatsApp Chat
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleToggleStatus(prayer)}
                            disabled={updatingId === prayer.id}
                            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25 transition-all flex items-center gap-1.5 cursor-pointer shadow-gold active:scale-95"
                          >
                            <CheckCircle2 size={14} />
                            <span>Mark Answered</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: Answered Prayer Requests */}
          {(statusFilter === 'all' || statusFilter === 'answered') && (
            <div className="glass-card overflow-hidden border border-emerald-500/30">
              {/* Accordion Fold Toggle Header */}
              <button
                type="button"
                onClick={() => setIsAnsweredFolded(!isAnsweredFolded)}
                style={{ backgroundColor: '#06130E' }}
                className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-emerald-950/60 transition-colors cursor-pointer border-b border-emerald-500/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-emerald-300 text-xs sm:text-sm">
                      Answered Prayers &amp; Praise Reports ({answeredPrayers.length})
                    </h3>
                    <p className="text-[11px] text-white/40">Testimonies &amp; answered intercessions</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                    {isAnsweredFolded && statusFilter !== 'answered' ? 'Folded (Click to Expand ▼)' : 'Expanded (Click to Fold ▲)'}
                  </span>
                </div>
              </button>

              {/* Foldable Content Body */}
              {(!isAnsweredFolded || statusFilter === 'answered') && (
                answeredPrayers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-white/40">
                    No answered prayer requests yet. Mark a pending prayer as answered to see it here!
                  </div>
                ) : (
                  <div className="divide-y divide-white/5 animate-fade-in">
                    {answeredPrayers.map((prayer, idx) => (
                      <div
                        key={prayer.id}
                        className="p-4 sm:p-5 bg-emerald-950/10 hover:bg-emerald-950/20 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div
                              className="w-9 sm:w-10 h-9 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold text-slate-950 flex-shrink-0 mt-0.5 shadow-sm opacity-80"
                              style={{ background: 'linear-gradient(135deg, #34D399, #059669)' }}
                            >
                              {(prayer.member_name || '?')[0]?.toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-emerald-200 text-sm sm:text-base">
                                  {prayer.member_name}
                                </span>
                                <span className="text-xs text-emerald-400/60 flex items-center gap-1">
                                  <Phone size={12} /> {prayer.member_phone}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  Answered Testimony
                                </span>
                              </div>

                              <p className="text-xs sm:text-sm text-white/80 leading-relaxed mt-2 p-3.5 rounded-xl bg-black/50 border border-emerald-500/15 whitespace-pre-wrap">
                                "{prayer.request_text}"
                              </p>

                              <div className="flex items-center gap-4 mt-2.5 text-[11px] text-white/40 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Clock size={12} />
                                  {prayer.created_at ? format(parseISO(prayer.created_at), 'MMM d, yyyy · HH:mm') : ''}
                                </span>

                                {prayer.conversation_id && (
                                  <Link
                                    href={`/conversations/${prayer.conversation_id}`}
                                    className="text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                                  >
                                    <MessageSquare size={12} /> Open WhatsApp Chat
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleToggleStatus(prayer)}
                              disabled={updatingId === prayer.id}
                              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <RotateCcw size={13} />
                              <span>Reopen to Pending</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}

        </div>
      )}
    </DashboardShell>
  );
}
