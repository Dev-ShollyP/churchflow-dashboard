'use client';

import { useState, useMemo, useEffect } from 'react';
import DashboardShell from '@/components/DashboardShell';
import {
  Search, BookOpen, Music, Copy, Check, X, Sparkles,
  BookMarked, Plus, Upload, Trash2, ChevronDown
} from 'lucide-react';
import hymnsData from '@/lib/rccg-hymns.json';

interface Hymn {
  number: number;
  title: string;
  category?: string;
  verses: string[];
  refrain?: string;
  scripture?: string;
  isCustom?: boolean;
}

const STORAGE_KEY = 'churchflow_custom_hymns';

function loadCustomHymns(): Hymn[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCustomHymns(hymns: Hymn[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(hymns));
}

export default function HymnsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHymn, setSelectedHymn] = useState<Hymn | null>(null);
  const [copied, setCopied] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [customHymns, setCustomHymns] = useState<Hymn[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('GENERAL HYMNS');
  const [uploadScripture, setUploadScripture] = useState('');
  const [uploadRefrain, setUploadRefrain] = useState('');
  const [uploadVerses, setUploadVerses] = useState('');
  const [uploadSaving, setUploadSaving] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    setCustomHymns(loadCustomHymns());
  }, []);

  // Only include hymns that have lyrics
  const baseHymns = (hymnsData as Hymn[]).filter(
    h => Array.isArray(h.verses) && h.verses.length > 0 && h.verses.some(v => v && v.trim() !== '')
  );

  const allHymns = useMemo(() => {
    const merged = [...baseHymns, ...customHymns.map(h => ({ ...h, isCustom: true }))];
    return merged.sort((a, b) => a.number - b.number);
  }, [baseHymns, customHymns]);

  const categories = useMemo(() => {
    const cats = new Set(allHymns.map(h => h.category || 'GENERAL').filter(Boolean));
    return ['ALL', ...Array.from(cats)];
  }, [allHymns]);

  const filteredHymns = useMemo(() => {
    let list = categoryFilter !== 'ALL'
      ? allHymns.filter(h => (h.category || 'GENERAL') === categoryFilter)
      : allHymns;

    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;

    const numQuery = parseInt(query, 10);
    if (!isNaN(numQuery)) {
      return list.filter(h => h.number === numQuery || h.number.toString().includes(query));
    }

    return list.filter(
      h =>
        h.title.toLowerCase().includes(query) ||
        (Array.isArray(h.verses) && h.verses.some(v => v.toLowerCase().includes(query))) ||
        (h.refrain && h.refrain.toLowerCase().includes(query))
    );
  }, [searchQuery, allHymns, categoryFilter]);

  const handleCopy = (hymn: Hymn) => {
    let fullText = `HYMN ${hymn.number} — ${hymn.title.toUpperCase()}\n\n`;
    if (hymn.verses && hymn.verses.length > 0) {
      hymn.verses.forEach((v, i) => {
        fullText += `Verse ${i + 1}:\n${v}\n\n`;
        if (hymn.refrain) fullText += `Refrain:\n${hymn.refrain}\n\n`;
      });
    }
    if (hymn.scripture) fullText += `\n📖 ${hymn.scripture}`;
    navigator.clipboard.writeText(fullText.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDeleteCustom = (number: number) => {
    const updated = customHymns.filter(h => h.number !== number);
    setCustomHymns(updated);
    saveCustomHymns(updated);
    setSelectedHymn(null);
  };

  const handleUpload = () => {
    if (!uploadTitle.trim() || !uploadVerses.trim()) return;
    setUploadSaving(true);

    const maxNum = allHymns.length > 0 ? Math.max(...allHymns.map(h => h.number)) : 0;
    const verses = uploadVerses
      .split(/\n\n+/)
      .map(v => v.trim())
      .filter(Boolean);

    const newHymn: Hymn = {
      number: maxNum + 1,
      title: uploadTitle.trim(),
      category: uploadCategory,
      scripture: uploadScripture.trim() || undefined,
      verses,
      refrain: uploadRefrain.trim() || undefined,
      isCustom: true,
    };

    const updated = [...customHymns, newHymn];
    setCustomHymns(updated);
    saveCustomHymns(updated);

    setTimeout(() => {
      setUploadSaving(false);
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
        setShowUpload(false);
        setUploadTitle('');
        setUploadCategory('GENERAL HYMNS');
        setUploadScripture('');
        setUploadRefrain('');
        setUploadVerses('');
      }, 1500);
    }, 600);
  };

  const HYMN_CATEGORIES = [
    'GENERAL HYMNS', 'MORNING HYMNS', 'EVENING HYMNS', 'PRAISE & WORSHIP',
    'CHRISTMAS HYMNS', 'EASTER HYMNS', 'COMMUNION HYMNS', 'INVITATION HYMNS',
    'CLOSING HYMNS', 'PRAYER HYMNS', 'YOUTH HYMNS'
  ];

  return (
    <DashboardShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <BookOpen className="text-gold" size={28} />
            Hymnal
          </h1>
          <p className="text-xs sm:text-sm text-white/50 mt-1">
            {allHymns.length} hymns with full lyrics · {customHymns.length} custom uploads
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Category Filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ backgroundColor: '#091124', color: '#ffffff' }}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl text-xs font-medium text-white border border-white/20 focus:border-gold/60 focus:outline-none cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat} style={{ backgroundColor: '#0D1B3E' }}>{cat}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Number or title..."
              style={{ backgroundColor: '#091124', color: '#ffffff' }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs text-white placeholder-white/40 border border-white/15 focus:border-gold/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Upload Button */}
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold btn-gold shadow-gold whitespace-nowrap"
          >
            <Plus size={14} />
            Add Hymn
          </button>
        </div>
      </div>

      {/* Hymn Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredHymns.slice(0, 200).map(hymn => {
          const snippet = hymn.verses[0]?.split('\n')[0] || '';
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
                  <div className="flex items-center gap-1.5">
                    {hymn.isCustom && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        Custom
                      </span>
                    )}
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {hymn.verses.length}v
                    </span>
                  </div>
                </div>
                <h3 className="font-display font-semibold text-white text-sm leading-snug group-hover:text-gold transition-colors line-clamp-2">
                  {hymn.title}
                </h3>
              </div>
              <p className="text-[11px] text-white/40 mt-3 line-clamp-2 italic font-serif leading-relaxed">
                &ldquo;{snippet}&rdquo;
              </p>
            </div>
          );
        })}
      </div>

      {filteredHymns.length === 0 && (
        <div className="glass-card p-12 text-center text-white/40 text-sm">
          No hymns found matching &ldquo;{searchQuery}&rdquo;. Try searching by number or keywords.
        </div>
      )}

      {filteredHymns.length > 200 && (
        <p className="text-center text-xs text-white/30 mt-6">
          Showing 200 of {filteredHymns.length} results. Refine your search to see more.
        </p>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            style={{ backgroundColor: '#0D1B3E', maxHeight: '90vh' }}
            className="w-full max-w-lg flex flex-col animate-slide-up rounded-2xl border border-gold/40 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Upload size={18} className="text-gold" />
                <h3 className="font-display font-semibold text-white text-base">Add New Hymn</h3>
              </div>
              <button onClick={() => setShowUpload(false)} className="text-white/40 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gold/90 mb-1.5 uppercase tracking-wide">
                  Hymn Title *
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  placeholder="e.g. Amazing Grace"
                  style={{ backgroundColor: '#091124', color: '#ffffff' }}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/30 border border-white/20 focus:border-gold/60 focus:outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gold/90 mb-1.5 uppercase tracking-wide">
                  Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={e => setUploadCategory(e.target.value)}
                  style={{ backgroundColor: '#091124', color: '#ffffff' }}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white border border-white/20 focus:border-gold/60 focus:outline-none cursor-pointer"
                >
                  {HYMN_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} style={{ backgroundColor: '#0D1B3E' }}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Scripture */}
              <div>
                <label className="block text-xs font-semibold text-gold/90 mb-1.5 uppercase tracking-wide">
                  Scripture Reference (optional)
                </label>
                <input
                  type="text"
                  value={uploadScripture}
                  onChange={e => setUploadScripture(e.target.value)}
                  placeholder="e.g. Psalm 100:4"
                  style={{ backgroundColor: '#091124', color: '#ffffff' }}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/30 border border-white/20 focus:border-gold/60 focus:outline-none"
                />
              </div>

              {/* Verses */}
              <div>
                <label className="block text-xs font-semibold text-gold/90 mb-1.5 uppercase tracking-wide">
                  Verses * <span className="normal-case text-white/40 font-normal">(separate each verse with a blank line)</span>
                </label>
                <textarea
                  value={uploadVerses}
                  onChange={e => setUploadVerses(e.target.value)}
                  placeholder={"Verse 1 line 1\nVerse 1 line 2\n\nVerse 2 line 1\nVerse 2 line 2"}
                  rows={10}
                  style={{ backgroundColor: '#091124', color: '#ffffff' }}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/30 border border-white/20 focus:border-gold/60 focus:outline-none resize-y font-mono leading-relaxed"
                />
              </div>

              {/* Refrain */}
              <div>
                <label className="block text-xs font-semibold text-gold/90 mb-1.5 uppercase tracking-wide">
                  Refrain / Chorus (optional)
                </label>
                <textarea
                  value={uploadRefrain}
                  onChange={e => setUploadRefrain(e.target.value)}
                  placeholder="Hallelujah! Hallelujah! ..."
                  rows={3}
                  style={{ backgroundColor: '#091124', color: '#ffffff' }}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/30 border border-white/20 focus:border-gold/60 focus:outline-none resize-y"
                />
              </div>

              {/* Preview */}
              {uploadVerses.trim() && (
                <div className="p-4 rounded-xl bg-black/40 border border-white/10">
                  <p className="text-xs font-bold text-white/50 uppercase tracking-wide mb-2">Preview</p>
                  <p className="text-xs text-white/70 font-bold">{uploadTitle || 'Untitled Hymn'}</p>
                  <p className="text-xs text-white/50 mt-1 whitespace-pre-line">
                    {uploadVerses.split(/\n\n+/)[0]?.split('\n').slice(0, 2).join('\n')}...
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-white/10 flex-shrink-0"
              style={{ backgroundColor: '#0D1B3E' }}
            >
              <button
                onClick={() => setShowUpload(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadTitle.trim() || !uploadVerses.trim() || uploadSaving}
                className="px-4 py-2 rounded-xl text-xs font-semibold btn-gold shadow-gold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadSaving ? (
                  <div className="w-3.5 h-3.5 border-2 border-navy-dark/30 border-t-navy-dark rounded-full animate-spin" />
                ) : uploadSuccess ? (
                  <Check size={14} />
                ) : (
                  <Plus size={14} />
                )}
                {uploadSuccess ? 'Hymn Added!' : uploadSaving ? 'Saving...' : 'Add to Hymnal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Hymn Reader Modal */}
      {selectedHymn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            style={{ backgroundColor: '#0D1B3E', maxHeight: '90vh' }}
            className="w-full max-w-2xl flex flex-col animate-slide-up rounded-2xl border border-gold/40 shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 px-6 py-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-gold text-navy-dark font-bold text-base flex items-center justify-center flex-shrink-0 shadow-gold">
                  #{selectedHymn.number}
                </span>
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-bold text-white leading-tight">
                    {selectedHymn.title}
                  </h2>
                  <p className="text-xs text-gold/70 mt-0.5 font-medium">
                    {selectedHymn.isCustom ? 'Custom Upload' : 'Hymnal'} &bull; {selectedHymn.verses?.length} Verses
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
                className="text-white/40 hover:text-white transition-colors p-1 flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-white/90 text-sm leading-relaxed font-serif">
              {selectedHymn.verses.map((verse, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-black/30 border border-white/5">
                  <p className="text-xs font-sans font-bold text-gold/80 mb-2 uppercase tracking-wide">
                    Verse {idx + 1}
                  </p>
                  <p className="whitespace-pre-line text-white/90 leading-relaxed">
                    {verse}
                  </p>
                  {selectedHymn.refrain && (
                    <div className="mt-3 pt-3 border-t border-gold/20">
                      <p className="text-xs font-sans text-gold/60 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Music size={11} /> Refrain
                      </p>
                      <p className="whitespace-pre-line italic text-gold-light/80 text-sm leading-relaxed">
                        {selectedHymn.refrain}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 flex-shrink-0" style={{ backgroundColor: '#0D1B3E' }}>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40">RCCG Everflourishing Sanctuary</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedHymn.isCustom && (
                  <button
                    onClick={() => handleDeleteCustom(selectedHymn.number)}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 size={13} />
                    Remove
                  </button>
                )}
                <button
                  onClick={() => handleCopy(selectedHymn)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold btn-gold shadow-gold flex items-center gap-1.5"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  {copied ? 'Copied!' : 'Copy Hymn'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
