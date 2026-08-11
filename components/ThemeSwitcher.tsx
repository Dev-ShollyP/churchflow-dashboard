'use client';

import { useEffect, useState } from 'react';
import { Palette, Check } from 'lucide-react';

export type ThemeId = 'royal-navy' | 'celestial-purple' | 'emerald-sanctuary' | 'obsidian-gold';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  previewBg: string;
  previewAccent: string;
}

export const themeOptions: ThemeOption[] = [
  {
    id: 'royal-navy',
    name: 'Royal Navy & Gold',
    previewBg: 'oklch(0.16 0.04 260)',
    previewAccent: 'oklch(0.78 0.16 75)',
  },
  {
    id: 'celestial-purple',
    name: 'Celestial Purple & Gold',
    previewBg: 'oklch(0.16 0.06 295)',
    previewAccent: 'oklch(0.82 0.17 80)',
  },
  {
    id: 'emerald-sanctuary',
    name: 'Emerald Sanctuary & Gold',
    previewBg: 'oklch(0.16 0.05 165)',
    previewAccent: 'oklch(0.80 0.15 85)',
  },
  {
    id: 'obsidian-gold',
    name: 'Obsidian Gold',
    previewBg: 'oklch(0.09 0.01 260)',
    previewAccent: 'oklch(0.84 0.18 78)',
  },
];

export default function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('royal-navy');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem('churchflow_theme') as ThemeId) || 'royal-navy';
    setCurrentTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const changeTheme = (themeId: ThemeId) => {
    setCurrentTheme(themeId);
    localStorage.setItem('churchflow_theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 text-gold border border-gold/30 hover:bg-gold/15 transition-all shadow-sm"
        title="Change Color Theme"
        aria-label="Theme selector"
      >
        <Palette size={15} />
        <span className="hidden sm:inline">Theme</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 glass-card p-3 shadow-2xl z-50 animate-popover space-y-1.5 border border-gold/30">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 px-2.5 py-1">
            OKLCH Theme System
          </p>
          {themeOptions.map((t) => (
            <button
              key={t.id}
              onClick={() => changeTheme(t.id)}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                currentTheme === t.id
                  ? 'bg-white/10 border border-gold/40 text-gold font-semibold shadow-sm'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0 flex items-center justify-center shadow-inner"
                  style={{ background: t.previewBg }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: t.previewAccent }}
                  />
                </div>
                <span className="truncate">{t.name}</span>
              </div>
              {currentTheme === t.id && <Check size={14} className="text-gold flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
