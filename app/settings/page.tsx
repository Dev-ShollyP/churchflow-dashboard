'use client';

import { useEffect, useState } from 'react';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import { Settings, Phone, Bot, Building, BellOff, Music, BookOpen, ShieldCheck, CheckCircle2, Search, Sparkles } from 'lucide-react';
import { searchHymn, getRCCGInfo, getHymnTotalCount } from '@/lib/rccg-knowledge';

export default function SettingsPage() {
  const [remindersPaused, setRemindersPaused] = useState(false);
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayReason, setHolidayReason] = useState('');
  const [hymnSearch, setHymnSearch] = useState('Hymn 1');
  const [hymnResult, setHymnResult] = useState<any>(searchHymn('Hymn 1'));
  const [infoTab, setInfoTab] = useState<'vision' | 'history' | 'doctrines' | 'leaders' | 'programs' | 'conduct'>('vision');
  const [infoContent, setInfoContent] = useState<string | null>(getRCCGInfo('vision'));
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const savedPause = localStorage.getItem('churchflow_reminders_paused');
    if (savedPause) setRemindersPaused(savedPause === 'true');

    const savedHolDate = localStorage.getItem('churchflow_holiday_date');
    if (savedHolDate) setHolidayDate(savedHolDate);

    const savedHolReason = localStorage.getItem('churchflow_holiday_reason');
    if (savedHolReason) setHolidayReason(savedHolReason);
  }, []);

  const handleTogglePause = () => {
    const next = !remindersPaused;
    setRemindersPaused(next);
    localStorage.setItem('churchflow_reminders_paused', String(next));
    showToast(next ? '⚠️ Automated service reminders PAUSED.' : '✓ Automated service reminders ACTIVE.');
  };

  const handleSaveHoliday = () => {
    localStorage.setItem('churchflow_holiday_date', holidayDate);
    localStorage.setItem('churchflow_holiday_reason', holidayReason);
    showToast('✓ Holiday cancellation override saved!');
  };

  const handleSearchHymn = (term: string) => {
    setHymnSearch(term);
    setHymnResult(searchHymn(term));
  };

  const handleSelectTab = (tab: 'vision' | 'history' | 'doctrines' | 'leaders' | 'programs' | 'conduct') => {
    setInfoTab(tab);
    setInfoContent(getRCCGInfo(tab));
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <DashboardShell>
      <PageHeader title="Settings & Bot Knowledge Base" subtitle="Manage automation schedules, token usage, and RCCG knowledge base" />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-gold text-navy-dark font-semibold text-xs shadow-gold animate-slide-up flex items-center gap-2">
          <CheckCircle2 size={16} />
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── 1. AUTOMATION & TOKEN SAVER CONTROLS ── */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <BellOff size={16} className="text-amber-400" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-white text-base">Automation &amp; Execution Saver</h2>
              <p className="text-[11px] text-white/40">Optimize n8n token quota &amp; control holiday cancellations</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-navy-dark/60 border border-white/8 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-white">Pause Automated Service Reminders</p>
                <p className="text-[11px] text-white/40 mt-0.5">Stops all automated broadcasts &amp; crons when services are suspended.</p>
              </div>
              <button
                type="button"
                onClick={handleTogglePause}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  remindersPaused ? 'bg-amber-500' : 'bg-white/20'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-navy-dark shadow ring-0 transition duration-200 ease-in-out ${
                    remindersPaused ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* National Holiday Cancellation Override */}
          <div className="p-3.5 rounded-xl bg-navy-dark/60 border border-white/8 space-y-3">
            <p className="text-xs font-semibold text-gold flex items-center gap-1.5">
              <ShieldCheck size={14} /> National Holiday Cancellation Override
            </p>
            <p className="text-[11px] text-white/40">
              If a regular weekly service is cancelled due to a public or national holiday, specify the date below so the bot automatically notifies members and suppresses reminders.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[10px] uppercase tracking-wide text-white/50 mb-1">Cancellation Date</label>
                <input
                  type="date"
                  value={holidayDate}
                  onChange={e => setHolidayDate(e.target.value)}
                  style={{ backgroundColor: '#091124', color: '#ffffff' }}
                  className="w-full px-3 py-1.5 rounded-xl text-xs text-white border border-white/10 focus:border-gold/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wide text-white/50 mb-1">Reason / Event</label>
                <input
                  type="text"
                  value={holidayReason}
                  onChange={e => setHolidayReason(e.target.value)}
                  placeholder="e.g. National Independence Day"
                  style={{ backgroundColor: '#091124', color: '#ffffff' }}
                  className="w-full px-3 py-1.5 rounded-xl text-xs text-white placeholder-white/30 border border-white/10 focus:border-gold/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSaveHoliday}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold btn-gold shadow-gold"
              >
                Save Override Rule
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. RCCG MASTER KNOWLEDGE BASE ── */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <div className="w-8 h-8 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center">
              <BookOpen size={16} className="text-gold" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-white text-base">RCCG Knowledge Base</h2>
              <p className="text-[11px] text-white/40">History, Vision, Mission, Doctrines &amp; Leadership</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex rounded-xl bg-navy-dark/60 p-1 border border-white/10 overflow-x-auto gap-1">
            {(['vision', 'history', 'doctrines', 'leaders', 'programs', 'conduct'] as const).map(tabKey => (
              <button
                key={tabKey}
                onClick={() => handleSelectTab(tabKey)}
                className={`flex-1 py-1.5 px-2 text-[11px] font-semibold rounded-lg capitalize whitespace-nowrap transition-all ${
                  infoTab === tabKey ? 'bg-gold text-navy-dark shadow-gold' : 'text-white/50 hover:text-white'
                }`}
              >
                {tabKey}
              </button>
            ))}
          </div>

          {/* Content Viewer */}
          <div className="p-3.5 rounded-xl bg-navy-dark/80 border border-white/8 text-xs text-white/80 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap">
            {infoContent}
          </div>
        </div>

        {/* ── 3. RCCG HYMNAL LOOKUP TOOL ── */}
        <div className="glass-card p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <Music size={16} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-white text-base">The Redeemed Hymnal - 4th Edition</h2>
                <p className="text-[11px] text-white/40">Search all {getHymnTotalCount()} RCCG Hymns by Number (1 to 826) or Lyrics</p>
              </div>
            </div>

            {/* Quick Hymn Pills */}
            <div className="hidden sm:flex items-center gap-1.5">
              {['Hymn 1', 'Hymn 10', 'Hymn 100', 'Hymn 115', 'Hymn 136', 'Hymn 148', 'Hymn 161'].map(h => (
                <button
                  key={h}
                  onClick={() => handleSearchHymn(h)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/5 border border-white/10 hover:border-gold/40 text-gold transition-colors"
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gold/60" />
            <input
              type="text"
              value={hymnSearch}
              onChange={e => handleSearchHymn(e.target.value)}
              placeholder="Type hymn number (e.g. '1', 'Hymn 100', '136') or title ('Forth in Your Name', 'Blessed Assurance')..."
              style={{ backgroundColor: '#091124', color: '#ffffff' }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm text-white placeholder-white/40 border border-gold/30 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 shadow-inner transition-colors"
            />
          </div>

          {/* Hymn Search Output Card */}
          {hymnResult ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-navy-dark/90 border border-gold/30 space-y-3 animate-fade-in">
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gold/20 text-gold border border-gold/30 mb-1">
                    THE REDEEMED HYMNAL NO. {hymnResult.number}
                  </span>
                  <h3 className="font-display font-semibold text-white text-base sm:text-lg">{hymnResult.title}</h3>
                  {hymnResult.scripture && (
                    <p className="text-[11px] text-gold-light/70 font-medium italic mt-0.5">
                      📖 {hymnResult.scripture}
                    </p>
                  )}
                  {hymnResult.author && (
                    <p className="text-[11px] text-white/40 mt-0.5">Composer: {hymnResult.author}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {hymnResult.verses.map((verse: string, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs sm:text-sm leading-relaxed text-gold-light/90 whitespace-pre-wrap">
                    {verse}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-white/30">
              No hymn found matching "{hymnSearch}". Try searching by hymn number (e.g. "Hymn 1" or "100") or title keywords.
            </div>
          )}
        </div>

      </div>
    </DashboardShell>
  );
}
