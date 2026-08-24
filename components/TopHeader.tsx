'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Menu, Bell, MessageSquare, X, Volume2, User, Sparkles, ArrowRight } from 'lucide-react';
import { getCurrentStaff, StaffMember, createClient } from '@/lib/supabase';

interface TopHeaderProps {
  onOpenSidebar?: () => void;
}

interface NotificationAlert {
  id: string;
  conversationId: string;
  senderName: string;
  messageText: string;
  time: string;
  isHumanRequest?: boolean;
}

interface SearchResultItem {
  id: string;
  type: 'member' | 'conversation';
  title: string;
  subtitle: string;
  url: string;
}

function playChimeSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15);

    osc2.frequency.setValueAtTime(261.63, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(329.63, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.6);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (e) {}
}

const NOTIFS_STORAGE_KEY = 'churchflow_notifications_v2';
const CLEARED_IDS_STORAGE_KEY = 'churchflow_cleared_msg_ids_v2';

function getStoredNotifications(): NotificationAlert[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(NOTIFS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredNotifications(notifs: NotificationAlert[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(notifs.slice(0, 30)));
  } catch {}
}

function getClearedMessageIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(CLEARED_IDS_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function addClearedMessageId(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const ids = getClearedMessageIds();
    ids.add(id);
    localStorage.setItem(CLEARED_IDS_STORAGE_KEY, JSON.stringify(Array.from(ids).slice(-300)));
  } catch {}
}

function addMultipleClearedMessageIds(idList: string[]) {
  if (typeof window === 'undefined') return;
  try {
    const ids = getClearedMessageIds();
    idList.forEach(id => ids.add(id));
    localStorage.setItem(CLEARED_IDS_STORAGE_KEY, JSON.stringify(Array.from(ids).slice(-300)));
  } catch {}
}

export default function TopHeader({ onOpenSidebar }: TopHeaderProps) {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [notifications, setNotifications] = useState<NotificationAlert[]>([]);
  const [activeToast, setActiveToast] = useState<NotificationAlert | null>(null);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchPopover, setShowSearchPopover] = useState(false);

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize notifications from localStorage on mount and register storage sync
  useEffect(() => {
    const savedNotifs = getStoredNotifications();
    if (savedNotifs.length > 0) {
      setNotifications(savedNotifs);
    }

    // Sync across browser tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === NOTIFS_STORAGE_KEY) {
        try {
          setNotifications(e.newValue ? JSON.parse(e.newValue) : []);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // Request desktop notification permission for background alerts
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    const savedPref = localStorage.getItem('churchflow_chime_enabled');
    if (savedPref !== null) {
      setAudioEnabled(savedPref === 'true');
    }

    const unlockAudio = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') {
            ctx.resume();
          }
        }
      } catch {}
      setAudioEnabled(true);
      localStorage.setItem('churchflow_chime_enabled', 'true');
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('pointerdown', unlockAudio);
    };
  }, []);

  const handleNewMemberMessage = (newMsg: any, playAudio: boolean = true) => {
    if (!newMsg || newMsg.sender !== 'member') return;
    const clearedIds = getClearedMessageIds();
    if (clearedIds.has(newMsg.id)) return;

    setNotifications(prev => {
      if (prev.some(n => n.id === newMsg.id)) return prev;

      const isHuman = /pastor|human|talk|speak|help|counsel|prayer|urgent|deacon/i.test(newMsg.message || '');
      const newNotif: NotificationAlert = {
        id: newMsg.id || Math.random().toString(),
        conversationId: newMsg.conversation_id,
        senderName: newMsg.sender_name || 'Member',
        messageText: newMsg.message,
        time: new Date(newMsg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isHumanRequest: isHuman,
      };

      const updated = [newNotif, ...prev.slice(0, 29)];
      saveStoredNotifications(updated);

      if (playAudio && audioEnabled) {
        playChimeSound();
      }

      if (playAudio) {
        setActiveToast(newNotif);
        setTimeout(() => {
          setActiveToast(current => current?.id === newNotif.id ? null : current);
        }, 8000);

        // Native background notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && document.hidden) {
          try {
            new Notification(isHuman ? '🚨 Human Assistance Requested' : '💬 RCCG EVF WhatsApp Message', {
              body: newMsg.message,
              icon: '/favicon.ico',
            });
          } catch {}
        }
      }

      return updated;
    });
  };

  const handleClearAll = () => {
    const idsToClear = notifications.map(n => n.id);
    addMultipleClearedMessageIds(idsToClear);
    setNotifications([]);
    saveStoredNotifications([]);
    setActiveToast(null);
  };

  const handleDismissOne = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    addClearedMessageId(id);
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      saveStoredNotifications(updated);
      return updated;
    });
    if (activeToast?.id === id) {
      setActiveToast(null);
    }
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowSearchPopover(false);
    router.push(`/members?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  useEffect(() => {
    getCurrentStaff().then(setStaff);
    const supabase = createClient();

    const fetchLatestInboundMessages = async () => {
      try {
        const { data } = await supabase
          .from('messages')
          .select('id, conversation_id, sender, message, created_at')
          .eq('sender', 'member')
          .order('created_at', { ascending: false })
          .limit(20);

        if (data && data.length > 0) {
          const clearedIds = getClearedMessageIds();
          const validMessages = data.filter(m => !clearedIds.has(m.id));

          setNotifications(prev => {
            let hasChanges = false;
            const existingIds = new Set(prev.map(n => n.id));
            const newItems: NotificationAlert[] = [];

            validMessages.forEach(m => {
              if (!existingIds.has(m.id)) {
                hasChanges = true;
                const isHuman = /pastor|human|talk|speak|help|counsel|prayer|urgent|deacon/i.test(m.message || '');
                newItems.push({
                  id: m.id,
                  conversationId: m.conversation_id,
                  senderName: 'Member',
                  messageText: m.message,
                  time: new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  isHumanRequest: isHuman,
                });
              }
            });

            if (!hasChanges) return prev;
            const merged = [...newItems, ...prev].slice(0, 30);
            saveStoredNotifications(merged);
            return merged;
          });
        }
      } catch (err) {
        console.error('Failed to fetch latest messages:', err);
      }
    };

    fetchLatestInboundMessages();
    const pollInterval = setInterval(fetchLatestInboundMessages, 6000);

    const channel = supabase
      .channel('header_messages_notifications_v2')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: any) => {
          handleNewMemberMessage(payload.new, true);
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <header
      className="sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-3 lg:py-3.5 backdrop-blur-xl border-b border-white/5 flex items-center justify-between gap-3"
      style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--border-gold)' }}
    >
      {/* Left: Mobile Toggle + Quick Functional Search */}
      <div className="flex items-center gap-2.5 flex-1 max-w-md">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-white/70 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex-shrink-0"
          aria-label="Open sidebar navigation"
        >
          <Menu size={18} />
        </button>

        <div className="relative flex-1">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowSearchPopover(true)}
              placeholder="Search members, conversations, events..."
              style={{ backgroundColor: '#091124', color: '#ffffff' }}
              className="w-full pl-9 pr-8 py-1.5 sm:py-2 rounded-xl text-xs text-white placeholder-white/40 border border-white/15 focus:border-gold/60 focus:outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowSearchPopover(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </form>

          {/* Search Dropdown Overlay */}
          {showSearchPopover && (
            <div
              style={{ backgroundColor: '#0D1B3E' }}
              className="absolute left-0 right-0 mt-2 p-2 rounded-2xl border border-gold/30 shadow-2xl z-50 animate-popover space-y-1"
            >
              <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-gold border-b border-white/10 mb-1">
                <span>Search Results</span>
                {isSearching && <span className="text-white/40 text-[10px]">Searching...</span>}
              </div>

              {searchResults.length === 0 && !isSearching ? (
                <div className="p-3 text-center text-xs text-white/40">
                  No direct matches for "{searchQuery}". Press Enter to search Members.
                </div>
              ) : (
                searchResults.map(item => (
                  <Link
                    key={item.id}
                    href={item.url}
                    onClick={() => setShowSearchPopover(false)}
                    className="p-2 rounded-xl block hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        {item.type === 'member' ? <User size={13} className="text-gold" /> : <MessageSquare size={13} className="text-emerald-400" />}
                        {item.title}
                      </span>
                      <ArrowRight size={12} className="text-white/30" />
                    </div>
                    <p className="text-[10px] text-white/40 mt-0.5 truncate">{item.subtitle}</p>
                  </Link>
                ))
              )}

              <button
                type="button"
                onClick={handleSearchSubmit}
                className="w-full mt-1 py-1.5 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/30 text-gold text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Search all records for "{searchQuery}"</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Sound Toggle */}
        <button
          onClick={toggleAudio}
          className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
            audioEnabled
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-gold/10 border-gold/30 text-gold hover:bg-gold/20'
          }`}
          title="Toggle notification sound chime"
        >
          <Volume2 size={15} />
          <span className="hidden md:inline text-[11px] font-semibold">{audioEnabled ? 'Sound Active' : 'Sound Muted'}</span>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="relative p-2 rounded-xl text-white/80 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold text-slate-950 text-[10px] font-bold flex items-center justify-center animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Popover Dropdown */}
          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 glass-card p-3.5 shadow-2xl border border-gold/30 z-50 animate-popover">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Bell size={14} className="text-gold" /> Live Notifications
                </h4>
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-[10px] text-gold hover:text-gold-light hover:underline font-semibold transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-6">No unread notifications.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl block transition-all border relative group ${
                        n.isHumanRequest
                          ? 'bg-red-500/15 border-red-500/30 text-white'
                          : 'bg-white/5 border-white/8 text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1 pr-6">
                        <span className={`font-semibold ${n.isHumanRequest ? 'text-red-300' : 'text-gold'}`}>
                          {n.isHumanRequest ? '🚨 Human Request' : '💬 WhatsApp Message'}
                        </span>
                        <span className="text-white/35 text-[9px]">{n.time}</span>
                      </div>
                      <Link
                        href={`/conversations/${n.conversationId}`}
                        onClick={() => setShowNotificationMenu(false)}
                        className="block hover:opacity-90 transition-opacity"
                      >
                        <p className="text-xs line-clamp-2 leading-relaxed text-white/90">{n.messageText}</p>
                      </Link>

                      {/* Individual dismiss button */}
                      <button
                        onClick={(e) => handleDismissOne(n.id, e)}
                        title="Dismiss notification"
                        className="absolute right-2 top-2 p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors opacity-80 group-hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-white/10 mx-0.5 hidden sm:block" />

        {/* User Profile Badge */}
        {staff && (
          <Link
            href="/profile"
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-gold/40 hover:bg-white/10 transition-all group"
          >
            <div
              className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border border-gold/40"
              style={{ background: 'linear-gradient(135deg, var(--accent-gold-light), var(--accent-gold-dark))' }}
            >
              {(staff as any).avatar_url ? (
                <img src={(staff as any).avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-slate-950">
                  {(staff.full_name || staff.email || 'S')[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-medium text-white group-hover:text-gold transition-colors leading-tight truncate max-w-[120px]">
                {staff.full_name || staff.email.split('@')[0]}
              </p>
              <p className="text-[9px] text-white/40 capitalize leading-tight">
                {staff.role.replace('_', ' ')}
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* Floating Toast Notification */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up max-w-sm w-full">
          <div className={`p-4 rounded-2xl glass-card border shadow-2xl flex items-start gap-3 ${
            activeToast.isHumanRequest
              ? 'bg-red-950/90 border-red-500/50 text-white shadow-red-500/20'
              : 'bg-slate-900/90 border-gold/40 text-white shadow-gold/20'
          }`}>
            <div className="p-2 rounded-xl bg-gold/20 text-gold flex-shrink-0 mt-0.5">
              <MessageSquare size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="font-semibold text-xs text-gold truncate">
                  {activeToast.isHumanRequest ? '🚨 Human Assistance Requested' : '💬 New WhatsApp Message'}
                </h4>
                <button
                  onClick={() => setActiveToast(null)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs text-white/80 line-clamp-2 leading-relaxed mb-2">
                "{activeToast.messageText}"
              </p>
              <Link
                href={`/conversations/${activeToast.conversationId}`}
                onClick={() => setActiveToast(null)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-gold hover:underline"
              >
                Open Live Chat →
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
