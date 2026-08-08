'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Search, Calendar, UploadCloud, Menu, Bell, MessageSquare, X, Volume2 } from 'lucide-react';
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

// Helper to play synthesized soft notification chime using Web Audio API
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

    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc1.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5

    osc2.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
    osc2.frequency.exponentialRampToValueAtTime(329.63, ctx.currentTime + 0.15); // E4

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.6);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (e) {
    // Web Audio blocked until user gesture
  }
}

export default function TopHeader({ onOpenSidebar }: TopHeaderProps) {
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [notifications, setNotifications] = useState<NotificationAlert[]>([]);
  const [activeToast, setActiveToast] = useState<NotificationAlert | null>(null);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const seenMessageIds = useRef<Set<string>>(new Set());

  // Auto-unlock Web Audio API on first user interaction anywhere on the document
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

  // Function to process a newly discovered member message
  const handleNewMemberMessage = (newMsg: any) => {
    if (!newMsg || newMsg.sender !== 'member') return;
    if (seenMessageIds.current.has(newMsg.id)) return;
    
    seenMessageIds.current.add(newMsg.id);

    // Play chime sound if enabled
    if (audioEnabled) {
      playChimeSound();
    }

    const isHuman = /pastor|human|talk|speak|help|counsel|prayer|urgent|deacon/i.test(newMsg.message || '');
    const newNotif: NotificationAlert = {
      id: newMsg.id || Math.random().toString(),
      conversationId: newMsg.conversation_id,
      senderName: 'Member',
      messageText: newMsg.message,
      time: new Date(newMsg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isHumanRequest: isHuman,
    };

    setNotifications(prev => [newNotif, ...prev.slice(0, 19)]);
    setActiveToast(newNotif);

    // Auto dismiss floating toast after 8 seconds
    setTimeout(() => {
      setActiveToast(current => current?.id === newNotif.id ? null : current);
    }, 8000);
  };

  const toggleAudio = () => {
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    localStorage.setItem('churchflow_chime_enabled', String(nextState));
    if (nextState) {
      playChimeSound();
    }
  };

  useEffect(() => {
    getCurrentStaff().then(setStaff);
    const supabase = createClient();

    // 1. Initial Load & Polling Fallback (runs every 6s to guarantee 100% notification delivery)
    const fetchLatestInboundMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, conversation_id, sender, message, created_at')
        .eq('sender', 'member')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        // If this is first run, populate seenMessageIds without alerting for ancient historical messages
        if (seenMessageIds.current.size === 0) {
          data.forEach(m => seenMessageIds.current.add(m.id));
        } else {
          // Check for any message created in the last 60 seconds that hasn't been seen
          const now = Date.now();
          data.forEach(m => {
            const msgTime = new Date(m.created_at).getTime();
            if (now - msgTime < 120000 && !seenMessageIds.current.has(m.id)) {
              handleNewMemberMessage(m);
            }
          });
        }
      }
    };

    fetchLatestInboundMessages();
    const pollInterval = setInterval(fetchLatestInboundMessages, 6000);

    // 2. Supabase Realtime Subscription
    const channel = supabase
      .channel('header_messages_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: any) => {
          handleNewMemberMessage(payload.new);
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 px-4 sm:px-6 lg:px-8 py-3 lg:py-4 backdrop-blur-md bg-opacity-70 border-b border-white/5 flex items-center justify-between gap-3"
      style={{ background: 'rgba(4, 12, 30, 0.85)', borderColor: 'var(--border-gold)' }}>

      {/* Left: Mobile Menu Toggle + Quick Search */}
      <div className="flex items-center gap-2.5 flex-1 max-w-md">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-white/70 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex-shrink-0"
          aria-label="Open mobile menu"
        >
          <Menu size={18} />
        </button>

        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search members, events..."
            className="w-full pl-9 pr-3 py-1.5 sm:py-2 rounded-xl text-xs text-white placeholder-white/25 bg-white/5 border border-white/10 focus:border-gold/50 focus:bg-white/10 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Right: Notification Bell, Quick Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

        {/* Enable Audio Chime Button */}
        <button
          onClick={toggleAudio}
          className={`p-2 rounded-xl border text-xs transition-all flex items-center gap-1 cursor-pointer ${
            audioEnabled
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-gold/10 border-gold/30 text-gold hover:bg-gold/20'
          }`}
          title="Toggle notification sound chime"
        >
          <Volume2 size={15} />
          <span className="hidden md:inline text-[11px] font-semibold">{audioEnabled ? 'Sound Active' : 'Sound Muted'}</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="relative p-2 rounded-xl text-white/70 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            title="Chat & Assistance Notifications"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold text-navy-dark text-[10px] font-bold flex items-center justify-center animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 glass-card p-3 shadow-2xl border border-gold/30 z-50 animate-slide-up">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Bell size={14} className="text-gold" /> Live Chat Notifications
                </h4>
                {notifications.length > 0 && (
                  <button
                    onClick={() => setNotifications([])}
                    className="text-[10px] text-white/40 hover:text-white"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-4">No new notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={`/conversations/${n.conversationId}`}
                      onClick={() => setShowNotificationMenu(false)}
                      className={`p-2.5 rounded-xl block transition-all border ${
                        n.isHumanRequest
                          ? 'bg-red-500/15 border-red-500/30 text-white'
                          : 'bg-white/5 border-white/8 text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className={`font-semibold ${n.isHumanRequest ? 'text-red-300' : 'text-gold'}`}>
                          {n.isHumanRequest ? '🚨 Human Assistance' : '💬 New Chat Message'}
                        </span>
                        <span className="text-white/30 text-[9px]">{n.time}</span>
                      </div>
                      <p className="text-xs line-clamp-2 leading-relaxed text-white/90">{n.messageText}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Upload Flyer button */}
        <Link
          href="/events/upload"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold btn-gold"
        >
          <UploadCloud size={14} />
          <span>Upload Flyer</span>
        </Link>

        {/* Quick Event button */}
        <Link
          href="/events"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium btn-glass"
        >
          <Calendar size={14} className="text-gold" />
          <span>Events</span>
        </Link>

        {/* Divider */}
        <div className="h-5 w-px bg-white/10 mx-0.5 hidden sm:block" />

        {/* Profile Avatar Badge */}
        {staff && (
          <Link
            href="/profile"
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-gold/30 hover:bg-white/10 transition-all group"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #8B6914)' }}>
              {(staff as any).avatar_url ? (
                <img src={(staff as any).avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] font-bold text-navy-dark">
                  {(staff.full_name || staff.email || 'S')[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-medium text-white group-hover:text-gold transition-colors leading-tight truncate max-w-[120px]">
                {staff.full_name || staff.email.split('@')[0]}
              </p>
              <p className="text-[9px] text-white/35 capitalize leading-tight">
                {staff.role.replace('_', ' ')}
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* Realtime Floating Toast Notification Popup */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up max-w-sm w-full">
          <div className={`p-4 rounded-2xl glass-card border shadow-2xl flex items-start gap-3 ${
            activeToast.isHumanRequest
              ? 'bg-red-950/90 border-red-500/50 text-white shadow-red-500/20'
              : 'bg-navy-mid/90 border-gold/40 text-white shadow-gold/20'
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
