'use client';

import { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Info, FileText, Sparkles, X } from 'lucide-react';
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

  // Template Modal State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('hello_world');
  const [templateParam, setTemplateParam] = useState('');
  const [templateSending, setTemplateSending] = useState(false);

  const handleSendText = async (e: React.FormEvent) => {
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
          text: `⚠ Saved to thread but NOT delivered via WhatsApp. ${data.meta_status}`,
        });
      }

      router.refresh();
      setTimeout(() => setStatus(null), 8000);
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message || 'Failed to send reply.' });
    } finally {
      setSending(false);
    }
  };

  const handleSendTemplate = async () => {
    setTemplateSending(true);
    setStatus(null);

    try {
      const res = await fetch('/api/whatsapp/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          member_phone: memberPhone,
          template_name: selectedTemplate,
          parameters: templateParam.trim() ? [templateParam.trim()] : [],
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to send WhatsApp template message.');
      }

      setStatus({
        type: 'success',
        text: `✓ Meta Template "${selectedTemplate}" delivered to member phone! 24-hour window reopened.`,
      });

      setShowTemplateModal(false);
      setTemplateParam('');
      router.refresh();
      setTimeout(() => setStatus(null), 8000);
    } catch (err: any) {
      setStatus({ type: 'error', text: err.message || 'Template message failed.' });
    } finally {
      setTemplateSending(false);
    }
  };

  return (
    <div className="mt-4 glass-card p-3.5 sm:p-4">
      {status && (
        <div className={`p-3 rounded-xl mb-3 text-xs flex items-start gap-2.5 animate-fade-in ${
          status.type === 'success'
            ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-300'
            : status.type === 'warning'
            ? 'bg-amber-500/15 border border-amber-500/25 text-amber-300'
            : 'bg-red-500/15 border border-red-500/25 text-red-300'
        }`}>
          {status.type === 'success' ? <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" /> : status.type === 'warning' ? <Info size={16} className="flex-shrink-0 mt-0.5" /> : <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <p className="leading-relaxed font-medium">{status.text}</p>
            {status.type === 'warning' && (
              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-semibold border border-amber-500/30 transition-all"
              >
                <FileText size={12} /> Send Meta Approved Template Message
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Text Input & Actions */}
      <form onSubmit={handleSendText} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder={`Reply directly to ${memberName || 'member'} on WhatsApp...`}
          disabled={sending}
          className="flex-1 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm text-white placeholder-white/30 bg-navy-dark/60 border border-white/10 focus:border-gold/50 focus:outline-none transition-colors"
        />

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold btn-glass flex items-center gap-1.5 text-gold hover:text-gold-light"
            title="Send WhatsApp Template Message (reopens 24h window)"
          >
            <FileText size={14} />
            <span className="hidden sm:inline">Template</span>
          </button>

          <button
            type="submit"
            disabled={sending || !replyText.trim()}
            className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-xl text-xs font-semibold text-navy-dark transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-gold"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #E8D48B)' }}
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-navy-dark/30 border-t-navy-dark rounded-full animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {sending ? 'Sending...' : 'Send WhatsApp'}
          </button>
        </div>
      </form>

      {/* Template Picker Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-5 sm:p-6 space-y-4 animate-slide-up border border-gold/30">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-gold" />
                <h3 className="font-display font-semibold text-white text-base">Send WhatsApp Template</h3>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-white/50 leading-relaxed">
              Meta requires an approved template message to contact members when more than 24 hours have passed since their last message.
            </p>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wide">
                Template Name (from Meta Business Manager)
              </label>
              <input
                type="text"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                placeholder="e.g. hello_world, church_announcement, etc."
                className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder-white/30 bg-navy-dark/80 border border-white/10 focus:border-gold/50 focus:outline-none"
              />
              <p className="text-[10px] text-white/40 mt-1">
                Must match an approved template name in your Meta WhatsApp Manager.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wide">
                Template Variable / Body Parameter (Optional)
              </label>
              <input
                type="text"
                value={templateParam}
                onChange={(e) => setTemplateParam(e.target.value)}
                placeholder="e.g. Pastor Olushola or Sunday Service 8:00 AM"
                className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder-white/25 bg-navy-dark/80 border border-white/10 focus:border-gold/50 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendTemplate}
                disabled={templateSending}
                className="px-4 py-2 rounded-xl text-xs font-semibold btn-gold shadow-gold flex items-center gap-1.5"
              >
                {templateSending ? (
                  <div className="w-3.5 h-3.5 border-2 border-navy-dark/30 border-t-navy-dark rounded-full animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                {templateSending ? 'Sending Template...' : 'Send Template Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
