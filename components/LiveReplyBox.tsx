'use client';

import { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LiveReplyBoxProps {
  conversationId: string;
  memberPhone?: string;
  memberName?: string;
}

export default function LiveReplyBox({ conversationId, memberPhone, memberName }: LiveReplyBoxProps) {
  const router = useRouter();
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSending(true);
    setStatus(null);

    try {
      const res = await fetch('/api/whatsapp/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          member_phone: memberPhone,
          message_text: replyText.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to process WhatsApp reply.');
      }

      setReplyText('');
      
      if (data.meta_delivered) {
        setStatus({
          type: 'success',
          text: '✓ WhatsApp message delivered live to member phone!',
        });
      } else {
        setStatus({
          type: 'warning',
          text: `Saved to thread. ${data.meta_status}`,
        });
      }

      router.refresh();
      setTimeout(() => setStatus(null), 6000);
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message || 'Failed to send reply.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-4 glass-card p-3 sm:p-4">
      {status && (
        <div className={`p-2.5 sm:p-3 rounded-xl mb-3 text-xs flex items-center gap-2 ${
          status.type === 'success'
            ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-300'
            : status.type === 'warning'
            ? 'bg-amber-500/15 border border-amber-500/25 text-amber-300'
            : 'bg-red-500/15 border border-red-500/25 text-red-300'
        }`}>
          {status.type === 'success' ? <CheckCircle2 size={14} /> : status.type === 'warning' ? <Info size={14} /> : <AlertCircle size={14} />}
          <span>{status.text}</span>
        </div>
      )}

      <form onSubmit={handleSend} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder={`Reply directly to ${memberName || 'member'} on WhatsApp...`}
          disabled={sending}
          className="flex-1 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm text-white placeholder-white/30 bg-navy-dark/60 border border-white/10 focus:border-gold/50 focus:outline-none transition-colors"
        />

        <button
          type="submit"
          disabled={sending || !replyText.trim()}
          className="px-4 sm:px-5 py-2.5 rounded-xl text-xs font-semibold text-navy-dark transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-shrink-0 shadow-gold"
          style={{ background: 'linear-gradient(135deg, #C9A84C, #E8D48B)' }}
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-navy-dark/30 border-t-navy-dark rounded-full animate-spin" />
          ) : (
            <Send size={14} />
          )}
          {sending ? 'Sending...' : 'Send WhatsApp'}
        </button>
      </form>
    </div>
  );
}
