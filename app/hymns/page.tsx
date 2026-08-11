'use client';

import { useState, useMemo } from 'react';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/ui/PageHeader';
import { Search, BookOpen, Music, Copy, Check, X, Sparkles, BookMarked } from 'lucide-react';
import hymnsData from '@/lib/rccg-hymns.json';

interface Hymn {
  number: number;
  title: string;
  category?: string;
  verses: string[];
  refrain?: string;
  scripture?: string;
}

export default function HymnsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHymn, setSelectedHymn] = useState<Hymn | null>(null);
  const [copied, setCopied] = useState(false);

  const hymnsList = hymnsData as Hymn[];

  const filteredHymns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return hymnsList;

    const numQuery = parseInt(query, 10);
    if (!isNaN(numQuery)) {
      return hymnsList.filter(h => h.number === numQuery || h.number.toString().includes(query));
    }

    return hymnsList.filter(
      h =>
        h.title.toLowerCase().includes(query) ||
        (Array.isArray(h.verses) && h.verses.some(v => v.toLowerCase().includes(query))) ||
        (h.refrain && h.refrain.toLowerCase().includes(query))
    );
  }, [searchQuery, hymnsList]);

  const handleCopy = (hymn: Hymn) => {
    let fullText = `HYMN ${hymn.number} — ${hymn.title.toUpperCase()}\n\n`;
    if (hymn.verses && hymn.verses.length > 0) {
      const versesText = hymn.verses
        .map((v, i) => `Verse ${i + 1}:\n${v}`)
        .join('\n\n');
      const refrainText = hymn.refrain ? `\n\nRefrain:\n${hymn.refrain}` : '';
      fullText += `${versesText}${refrainText}`;
    } else {
      fullText += `Official Entry in The Redeemed Hymnal (4th Edition), Hymn No. ${hymn.number}.\nPlease consult your physical RCCG Hymnal book for full printed lyrics & musical score.`;
    }

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <DashboardShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="text-gold" size={28} />
            RCCG Hymnal (4th Edition)
          </h1>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            Complete digital directory of all 826 hymns of The Redeemed Christian Church of God.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by number (e.g. 20) or title..."
            style={{ backgroundColor: '#091124', color: '#ffffff' }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm text-white placeholder-white/40 border border-white/15 focus:border-gold/50 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Hymn Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredHymns.slice(0, 100).map(hymn => {
          const hasVerses = Array.isArray(hymn.verses) && hymn.verses.length > 0;
          const snippet = hasVerses ? hymn.verses[0]?.split('\n')[0] : 'Official Entry in The Redeemed Hymnal';

          return (
            <div
              key={hymn.number}
              onClick={() => setSelectedHymn(hymn)}
              className="glass-card p-4 hover:border-gold/50 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/30 text-gold font-bold text-xs flex items-center justify-center flex-shrink-0 group-hover:bg-gold group-hover:text-navy-dark transition-all">
                    #{hymn.number}
                  </span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    hasVerses ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-white/5 text-white/40 border border-white/10'
                  }`}>
                    {hasVerses ? `${hymn.verses.length} Verses` : 'RCCG Entry'}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-white text-sm leading-snug group-hover:text-gold transition-colors line-clamp-2">
                  {hymn.title}
                </h3>
              </div>

              <p className="text-[11px] text-white/40 mt-3 line-clamp-2 italic font-serif leading-relaxed">
                "{snippet}"
              </p>
            </div>
          );
        })}
      </div>

      {filteredHymns.length === 0 && (
        <div className="glass-card p-12 text-center text-white/40 text-sm">
          No hymns found matching "{searchQuery}". Try searching by hymn number (e.g. 20) or keywords.
        </div>
      )}

      {/* Full Hymn Reader Modal */}
      {selectedHymn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            style={{ backgroundColor: '#0D1B3E' }}
            className="w-full max-w-2xl max-h-[85vh] p-6 rounded-2xl border border-gold/40 shadow-2xl flex flex-col animate-slide-up"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-gold text-navy-dark font-bold text-base flex items-center justify-center flex-shrink-0 shadow-gold">
                  #{selectedHymn.number}
                </span>
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-bold text-white leading-tight">
                    {selectedHymn.title}
                  </h2>
                  <p className="text-xs text-gold/70 mt-0.5 font-medium">
                    The Redeemed Hymnal (4th Edition) {selectedHymn.verses?.length ? `• ${selectedHymn.verses.length} Verses` : ''}
                  </p>
                  {selectedHymn.scripture && (
                    <p className="text-[11px] text-white/40 italic mt-0.5">
                      📖 {selectedHymn.scripture}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedHymn(null)}
                className="text-white/40 hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Verses + Refrain OR Official Entry Fallback */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-2 text-white/90 text-sm sm:text-base leading-relaxed font-serif">
              {Array.isArray(selectedHymn.verses) && selectedHymn.verses.length > 0 ? (
                <>
                  {selectedHymn.verses.map((verse, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-black/30 border border-white/5">
                      <p className="text-xs font-sans font-bold text-gold/80 mb-2 uppercase tracking-wide">
                        Verse {idx + 1}
                      </p>
                      <p className="whitespace-pre-line text-white/90 leading-relaxed">
                        {verse}
                      </p>
                    </div>
                  ))}

                  {selectedHymn.refrain && (
                    <div className="p-4.5 rounded-xl bg-gold/10 border border-gold/30 text-gold-light">
                      <p className="text-xs font-sans font-bold text-gold mb-2 uppercase tracking-wide flex items-center gap-1.5">
                        <Music size={14} /> Refrain / Chorus
                      </p>
                      <p className="whitespace-pre-line leading-relaxed font-semibold italic text-gold-light">
                        {selectedHymn.refrain}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-6 rounded-2xl bg-black/40 border border-gold/20 text-center space-y-3 font-sans">
                  <div className="w-12 h-12 rounded-2xl bg-gold/15 border border-gold/30 text-gold flex items-center justify-center mx-auto">
                    <BookMarked size={24} />
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-white text-base">
                      Official Entry — Hymn #{selectedHymn.number}
                    </h4>
                    <p className="text-xs text-white/60 mt-1.5 leading-relaxed max-w-md mx-auto">
                      This is an official registered hymn in <strong>The Redeemed Hymnal (4th Edition)</strong>. Digital lyrics transcription is currently active. For complete musical notation and stanza lyrics, please refer to your printed RCCG Hymnal book.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-4">
              <span className="text-xs text-white/40">RCCG Everflourishing Sanctuary</span>
              <button
                onClick={() => handleCopy(selectedHymn)}
                className="px-4 py-2 rounded-xl text-xs font-semibold btn-gold shadow-gold flex items-center gap-1.5"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? 'Copied to Clipboard!' : 'Copy Hymn Info'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
