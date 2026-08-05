'use client';

import { useEffect, useState } from 'react';
import { Palette, Check } from 'lucide-react';

export type ThemeId = 'royal-navy' | 'celestial-purple' | 'emerald-sanctuary';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  gradient: string;
  previewBg: string;
  previewAccent: string;
}

export const themeOptions: ThemeOption[] = [
  {
    id: 'royal-navy',
    name: 'Royal Navy & Gold',
    gradient: 'linear-gradient(135deg, #040C1E 0%, #070E21 100%)',
    previewBg: '#0D1B3E',
    previewAccent: '#C9A84C',
  },
  {
    id: 'celestial-purple',
    name: 'Celestial Purple & Gold',
    gradient: 'linear-gradient(135deg, #0B051B 0%, #12092B 100%)',
    previewBg: '#211344',
    previewAccent: '#F3C64F',
  },
  {
    id: 'emerald-sanctuary',
    name: 'Emerald Sanctuary & Gold',
    gradient: 'linear-gradient(135deg, #02120D 0%, #041A14 100%)',
    previewBg: '#0C2C23',
    previewAccent: '#E5C158',
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
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-navy-mid/80 text-gold border border-gold/30 hover:bg-gold/15 transition-all shadow-md"
        title="Change Color Theme"
      >
        <Palette size={15} />
        <span className="hidden sm:inline">Theme</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 glass-card p-3 shadow-2xl z-50 animate-slide-up space-y-2 border border-gold/30">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/50 px-2 py-1">Select Theme</p>
          {themeOptions.map((t) => (
            <button
              key={t.id}
              onClick={() => changeTheme(t.id)}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                currentTheme === t.id
                  ? 'bg-navy-soft border border-gold/40 text-gold font-semibold'
                  : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0"
                  style={{ background: t.previewBg }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full m-auto mt-1"
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
