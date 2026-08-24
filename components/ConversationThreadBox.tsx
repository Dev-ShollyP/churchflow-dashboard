'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock, MessageSquare, ChevronDown, CheckCheck, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface MessageItem {
  id: string;
  sender: string;
  message: string;
  created_at: string;
}

interface ConversationThreadBoxProps {
  messages: MessageItem[];
  conversationId?: string;
}

export default function ConversationThreadBox({ messages, conversationId }: ConversationThreadBoxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollToBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    // Auto-scroll to the newest message on initial mount (WhatsApp behavior)
    scrollToBottom(false);

    // Mark conversation as read and resolve any human requests
    if (conversationId && typeof window !== 'undefined') {
      try {
        const nowISO = new Date().toISOString();
        
        // 1. Mark read timestamp
        const rawRead = localStorage.getItem('churchflow_read_conv_timestamps_v1');
        const readMap = rawRead ? JSON.parse(rawRead) : {};
        readMap[conversationId] = nowISO;
        localStorage.setItem('churchflow_read_conv_timestamps_v1', JSON.stringify(readMap));

        // 2. Mark human request resolved
        const rawResolved = localStorage.getItem('churchflow_resolved_human_requests_v1');
        const resolvedMap = rawResolved ? JSON.parse(rawResolved) : {};
        resolvedMap[conversationId] = nowISO;
        localStorage.setItem('churchflow_resolved_human_requests_v1', JSON.stringify(resolvedMap));

        // 3. Clear from header notifications
        const rawNotifs = localStorage.getItem('churchflow_notifications_v2');
        if (rawNotifs) {
          const notifs = JSON.parse(rawNotifs);
          const filtered = notifs.filter((n: any) => n.conversationId !== conversationId);
          localStorage.setItem('churchflow_notifications_v2', JSON.stringify(filtered));
        }

        // Trigger storage event for live UI update
        window.dispatchEvent(new Event('storage'));
      } catch {}
    }
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollToBottom(true);
  }, [messages.length]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // If user scrolled up more than 120px from bottom, show scroll-to-last button
    const isUp = scrollHeight - scrollTop - clientHeight > 120;
    setShowScrollBtn(isUp);
  };

  return (
    <div className="relative">
      {/* Scrollable Thread Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="glass-card p-3.5 sm:p-5 space-y-3 max-h-[60vh] sm:max-h-[65vh] overflow-y-auto relative scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="py-12 text-center">
            <MessageSquare size={32} className="mx-auto text-white/20 mb-2" />
            <p className="text-white/30 text-sm">No messages in this conversation yet.</p>
          </div>
        ) : (
          messages.map((msg: MessageItem) => {
            const isMember = msg.sender === 'member';
            return (
              <div
                key={msg.id}
                className={`flex ${isMember ? 'justify-start' : 'justify-end'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] ${
                    isMember ? 'bubble-member' : 'bubble-assistant'
                  } px-3.5 sm:px-4 py-2.5 shadow-md`}
                >
                  <p
                    className={`text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      isMember ? 'text-white/90' : 'text-gold-light'
                    }`}
                  >
                    {msg.message}
                  </p>

                  <div
                    className={`text-[9px] sm:text-[10px] mt-1.5 flex items-center gap-1 ${
                      isMember ? 'text-white/30 justify-start' : 'text-gold/50 justify-end'
                    }`}
                  >
                    <Clock size={9} />
                    <span>{msg.created_at ? format(parseISO(msg.created_at), 'MMM d, HH:mm') : ''}</span>

                    {/* WhatsApp-style Delivery Ticks for Outbound Assistant/Staff Messages */}
                    {!isMember && (
                      <span className="inline-flex items-center ml-1 text-[#53bdeb] font-bold" title="Delivered via WhatsApp">
                        <CheckCheck size={13} className="text-[#53bdeb]" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Scroll anchor target */}
        <div ref={bottomRef} />
      </div>

      {/* WhatsApp-Style Floating Jump-to-Bottom Button */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-4 right-4 z-20 p-2.5 rounded-full bg-navy-mid/90 text-gold border border-gold/40 shadow-2xl hover:scale-110 hover:bg-gold hover:text-navy-dark transition-all duration-200 flex items-center gap-1 text-xs font-semibold"
          title="Jump to latest message"
        >
          <ChevronDown size={16} />
          <span className="hidden sm:inline">Last Message</span>
        </button>
      )}
    </div>
  );
}
