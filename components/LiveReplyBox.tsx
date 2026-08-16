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
  const [selectedTemplate, setSelectedTemplate] = useState('staff_followup');
  const [paramMemberName, setParamMemberName] = useState(memberName || 'Member');
  const [paramStaffName, setParamStaffName] = useState('Pastor / Staff Member');
  const [remTitleUpper, setRemTitleUpper] = useState('SUNDAY WORSHIP CELEBRATION');
  const [remOffset, setRemOffset] = useState('IN 30 MINUTES');
  const [remMemberName, setRemMemberName] = useState(memberName || 'Believer');
  const [remServiceName, setRemServiceName] = useState('Sunday Worship Celebration');
  const [remDate, setRemDate] = useState('Sunday');
  const [remTime, setRemTime] = useState('8:00 AM');
  const [remVerse, setRemVerse] = useState('"Enter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name." — Psalm 100:4');
  const [remFlyerUrl, setRemFlyerUrl] = useState('https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers/Service/First%20Service.jpg');
  const [customParams, setCustomParams] = useState('');
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

      let data: any = {};
      try {
        const textRes = await res.text();
        data = textRes ? JSON.parse(textRes) : {};
      } catch {
        throw new Error(`Server returned HTTP ${res.status}: Connection or API error.`);
      }

      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status} Error`);
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
          text: `⚠ Saved to chat thread! ${data.meta_status || 'Meta API pending.'}`,
        });
      }

      router.refresh();
      setTimeout(() => setStatus(null), 8000);
    } catch (err: any) {
      const msg = err.message === 'Failed to fetch' || err.message === 'fetch failed'
        ? 'Could not connect to WhatsApp API endpoint (network or server offline).'
        : err.message || 'Failed to send reply.';
      setStatus({ type: 'error', text: msg });
    } finally {
      setSending(false);
    }
  };

  const handleSendTemplate = async () => {
    setTemplateSending(true);
    setStatus(null);

    let finalParams: string[] = [];
    let flyerUrlToSend = '';

    if (selectedTemplate === 'staff_followup' || selectedTemplate === 'human_agent_takeover') {
      finalParams = [paramMemberName.trim(), paramStaffName.trim()];
    } else if (selectedTemplate === 'service_reminder') {
      finalParams = [
        remTitleUpper.trim() || 'SUNDAY WORSHIP CELEBRATION',
        remOffset.trim() || 'IN 30 MINUTES',
        remMemberName.trim() || paramMemberName.trim() || 'Believer',
        remServiceName.trim() || 'Sunday Worship Celebration',
        remDate.trim() || 'Sunday',
        remTime.trim() || '8:00 AM',
        remVerse.trim() || '"Enter into his gates with thanksgiving." — Psalm 100:4',
      ];
      flyerUrlToSend = remFlyerUrl.trim();
    } else if (customParams.trim()) {
      finalParams = customParams.split(',').map(s => s.trim());
    }

    try {
      const res = await fetch('/api/whatsapp/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          member_phone: memberPhone,
          template_name: selectedTemplate,
          language_code: 'en',
          parameters: finalParams,
          header_image_url: flyerUrlToSend,
        }),
      });

      let data: any = {};
      try {
        const textRes = await res.text();
        data = textRes ? JSON.parse(textRes) : {};
      } catch {
        throw new Error(`Server returned HTTP ${res.status}: Connection or API error.`);
      }

      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status} Error`);
      }

      if (data.delivered === false && data.warning) {
        setStatus({
          type: 'warning',
          text: `⚠ ${data.warning}`,
        });
      } else {
        setStatus({
          type: 'success',
          text: `✓ Meta Template "${selectedTemplate}" delivered to member phone! 24-hour window reopened.`,
        });
      }

      setShowTemplateModal(false);
      router.refresh();
      setTimeout(() => setStatus(null), 8000);
    } catch (err: any) {
      const msg = err.message === 'Failed to fetch' || err.message === 'fetch failed'
        ? 'Could not connect to WhatsApp API endpoint (network or server offline).'
        : err.message || 'Template message failed.';
      setStatus({ type: 'error', text: msg });
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

      {/* Inline Quick Template Selection Header */}
      <div className="mb-2.5 flex items-center justify-between gap-2 px-1">
        <span className="text-[11px] font-semibold text-gold/80 flex items-center gap-1.5">
          <Sparkles size={12} />
          WhatsApp Live Chat &amp; Meta Handoff
        </span>
        <button
          type="button"
          onClick={() => setShowTemplateModal(true)}
          className="text-[11px] font-medium text-gold hover:text-gold-light underline flex items-center gap-1 transition-colors"
        >
          <FileText size={11} />
          Select Meta Template (Over 24h Window)
        </button>
      </div>

      {/* Main Text Input & Actions */}
      <form onSubmit={handleSendText} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder={`Reply directly to ${memberName || 'member'} on WhatsApp...`}
          disabled={sending}
          style={{ backgroundColor: '#091124', color: '#ffffff' }}
          className="flex-1 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm text-white placeholder-white/40 border border-white/15 focus:border-gold/60 focus:outline-none transition-colors shadow-inner"
        />

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="px-3.5 py-2.5 rounded-xl text-xs font-semibold btn-glass flex items-center gap-1.5 text-gold hover:text-gold-light border border-gold/30"
            title="Send WhatsApp Template Message (reopens 24h window)"
          >
            <FileText size={14} />
            <span>Select Template</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            style={{ backgroundColor: '#0D1B3E', maxHeight: '90vh' }}
            className="w-full max-w-lg flex flex-col animate-slide-up rounded-2xl border border-gold/40 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-gold" />
                <h3 className="font-display font-semibold text-white text-base">Select Meta Approved Template</h3>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-4">

            <p className="text-xs text-white/70 leading-relaxed">
              Meta requires an approved template message to contact members when more than 24 hours have passed since their last message.
            </p>

            {/* Template Selector Presets */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gold/90 mb-1.5 uppercase tracking-wide">
                  Approved WhatsApp Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  style={{ backgroundColor: '#091124', color: '#ffffff' }}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs text-white border border-white/20 focus:border-gold/60 focus:outline-none cursor-pointer"
                >
                  <option value="staff_followup" style={{ backgroundColor: '#0D1B3E', color: '#ffffff' }}>
                    Staff Followup / Chat Handoff (staff_followup - Approved ✅)
                  </option>
                  <option value="service_reminder" style={{ backgroundColor: '#0D1B3E', color: '#ffffff' }}>
                    Church Service &amp; Program Reminder (service_reminder - Approved ✅)
                  </option>
                  <option value="custom" style={{ backgroundColor: '#0D1B3E', color: '#ffffff' }}>
                    Custom Approved Template
                  </option>
                </select>
              </div>

              {/* Dynamic Preset Inputs for staff_followup */}
              {(selectedTemplate === 'staff_followup' || selectedTemplate === 'human_agent_takeover') && (
                <div
                  style={{ backgroundColor: '#060B18' }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-white/10"
                >
                  <div>
                    <label className="block text-[11px] font-medium text-gold/80 mb-1">
                      Member Name &#123;&#123;1&#125;&#125;
                    </label>
                    <input
                      type="text"
                      value={paramMemberName}
                      onChange={(e) => setParamMemberName(e.target.value)}
                      placeholder="e.g. Ayomide"
                      style={{ backgroundColor: '#0D1B3E', color: '#ffffff' }}
                      className="w-full px-3 py-2 rounded-lg text-xs text-white border border-white/15 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gold/80 mb-1">
                      Staff / Pastor Name &#123;&#123;2&#125;&#125;
                    </label>
                    <input
                      type="text"
                      value={paramStaffName}
                      onChange={(e) => setParamStaffName(e.target.value)}
                      placeholder="e.g. Olushola"
                      style={{ backgroundColor: '#0D1B3E', color: '#ffffff' }}
                      className="w-full px-3 py-2 rounded-lg text-xs text-white border border-white/15 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Preset Inputs for service_reminder (All 7 Parameters & Image Header) */}
              {selectedTemplate === 'service_reminder' && (
                <div
                  style={{ backgroundColor: '#060B18' }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-xl border border-white/10"
                >
                  <div>
                    <label className="block text-[11px] font-medium text-gold/80 mb-1">
                      Header Title &#123;&#123;1&#125;&#125; (UPPERCASE)
                    </label>
                    <input
                      type="text"
                      value={remTitleUpper}
                      onChange={(e) => setRemTitleUpper(e.target.value)}
                      placeholder="e.g. SUNDAY WORSHIP CELEBRATION"
                      style={{ backgroundColor: '#0D1B3E', color: '#ffffff' }}
                      className="w-full px-3 py-2 rounded-lg text-xs text-white border border-white/15 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gold/80 mb-1">
                      Time / Offset &#123;&#123;2&#125;&#125;
                    </label>
                    <input
                      type="text"
                      value={remOffset}
                      onChange={(e) => setRemOffset(e.target.value)}
                      placeholder="e.g. IN 30 MINUTES or TOMORROW AT 8:00 AM"
                      style={{ backgroundColor: '#0D1B3E', color: '#ffffff' }}
                      className="w-full px-3 py-2 rounded-lg text-xs text-white border border-white/15 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gold/80 mb-1">
                      Member First Name &#123;&#123;3&#125;&#125;
                    </label>
                    <input
                      type="text"
                      value={remMemberName}
                      onChange={(e) => setRemMemberName(e.target.value)}
                      placeholder="e.g. Olushola"
                      style={{ backgroundColor: '#0D1B3E', color: '#ffffff' }}
                      className="w-full px-3 py-2 rounded-lg text-xs text-white border border-white/15 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gold/80 mb-1">
                      Service Name &#123;&#123;4&#125;&#125;
                    </label>
                    <input
                      type="text"
                      value={remServiceName}
                      onChange={(e) => setRemServiceName(e.target.value)}
                      placeholder="e.g. Sunday Worship Celebration"
                      style={{ backgroundColor: '#0D1B3E', color: '#ffffff' }}
                      className="w-full px-3 py-2 rounded-lg text-xs text-white border border-white/15 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gold/80 mb-1">
                      Date Label &#123;&#123;5&#125;&#125;
                    </label>
                    <input
                      type="text"
                      value={remDate}
                      onChange={(e) => setRemDate(e.target.value)}
                      placeholder="e.g. Sunday, August 16"
                      style={{ backgroundColor: '#0D1B3E', color: '#ffffff' }}
                      className="w-full px-3 py-2 rounded-lg text-xs text-white border border-white/15 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gold/80 mb-1">
                      Time Label &#123;&#123;6&#125;&#125;
                    </label>
                    <input
                      type="text"
                      value={remTime}
                      onChange={(e) => setRemTime(e.target.value)}
                      placeholder="e.g. 8:00 AM"
                      style={{ backgroundColor: '#0D1B3E', color: '#ffffff' }}
                      className="w-full px-3 py-2 rounded-lg text-xs text-white border border-white/15 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-gold/80 mb-1">
                      Scripture Verse &#123;&#123;7&#125;&#125;
                    </label>
                    <input
                      type="text"
                      value={remVerse}
                      onChange={(e) => setRemVerse(e.target.value)}
                      placeholder='e.g. "Enter into his gates with thanksgiving." — Psalm 100:4'
                      style={{ backgroundColor: '#0D1B3E', color: '#ffffff' }}
                      className="w-full px-3 py-2 rounded-lg text-xs text-white border border-white/15 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-gold/80 mb-1">
                      Flyer Image Header URL
                    </label>
                    <input
                      type="text"
                      value={remFlyerUrl}
                      onChange={(e) => setRemFlyerUrl(e.target.value)}
                      placeholder="https://.../Flyer.jpg"
                      style={{ backgroundColor: '#0D1B3E', color: '#ffffff' }}
                      className="w-full px-3 py-2 rounded-lg text-xs text-white border border-white/15 focus:border-gold/50 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedTemplate === 'custom' && (
                <div>
                  <label className="block text-xs font-semibold text-white/60 mb-1 uppercase tracking-wide">
                    Custom Template Parameters (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={customParams}
                    onChange={(e) => setCustomParams(e.target.value)}
                    placeholder="Parameter 1, Parameter 2, Parameter 3"
                    style={{ backgroundColor: '#091124', color: '#ffffff' }}
                    className="w-full px-3 py-2.5 rounded-xl text-xs text-white border border-white/20 focus:border-gold/60 focus:outline-none"
                  />
                </div>
              )}

              {/* Template Live Preview Box */}
              <div
                style={{ backgroundColor: '#060B18' }}
                className="p-3.5 rounded-xl border border-gold/30 space-y-1.5"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gold">
                  <Sparkles size={13} />
                  <span>Meta Live Message Preview</span>
                </div>
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-xs text-white/90 leading-relaxed font-sans whitespace-pre-line">
                  {(selectedTemplate === 'staff_followup' || selectedTemplate === 'human_agent_takeover') ? (
                    <span>
                      Hello <strong>{paramMemberName || '{{1}}'}</strong>, this is <strong>{paramStaffName || '{{2}}'}</strong> from RCCG Everflourishing Mega Sanctuary. Regarding your message to our church line, I am available to chat with you now. How can we assist or pray with you today?
                    </span>
                  ) : selectedTemplate === 'service_reminder' ? (
                    <div>
                      🔔 Hello REMINDER: <strong>{remTitleUpper || '{{1}}'}</strong> — <strong>{remOffset || '{{2}}'}</strong>!
                      <br /><br />
                      Dear <strong>{remMemberName || '{{3}}'}</strong>, this is a reminder for our upcoming service.
                      <br /><br />
                      • Service: <strong>{remServiceName || '{{4}}'}</strong><br />
                      • Date: <strong>{remDate || '{{5}}'}</strong><br />
                      • Time: <strong>{remTime || '{{6}}'}</strong> WAT<br />
                      📍 Address: 7, Powerline Street, Moshalashi B/Stop, Iyana Iyesi, Ota, Ogun State.
                      <br /><br />
                      📖 Verse: <em>{remVerse || '{{7}}'}</em>
                      <br /><br />
                      See you there! God bless you. 🙏
                    </div>
                  ) : (
                    <span>Meta approved template message dispatch...</span>
                  )}
                </div>
              </div>
            </div>

            {/* Close scrollable body */}
            </div>

            {/* Sticky Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-4 border-t border-white/10 flex-shrink-0" style={{ backgroundColor: '#0D1B3E' }}>
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
                className="px-4.5 py-2 rounded-xl text-xs font-semibold btn-gold shadow-gold flex items-center gap-1.5"
              >
                {templateSending ? (
                  <div className="w-3.5 h-3.5 border-2 border-navy-dark/30 border-t-navy-dark rounded-full animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                {templateSending ? 'Sending Template...' : 'Send WhatsApp Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

