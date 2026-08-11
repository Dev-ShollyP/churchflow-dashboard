import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: 'var(--sidebar-bg)',
          dark: 'oklch(0.08 0.02 270)',
          light: 'oklch(0.18 0.04 265)',
          mid: 'oklch(0.15 0.04 265)',
          soft: 'oklch(0.22 0.05 265)',
        },
        gold: {
          DEFAULT: 'var(--accent-gold)',
          light: 'var(--accent-gold-light)',
          dark: 'var(--accent-gold-dark)',
          soft: 'oklch(0.92 0.08 85)',
          dim: 'oklch(0.50 0.12 70)',
        },
        surface: {
          DEFAULT: 'var(--card-bg)',
          2: 'oklch(0.18 0.04 265)',
          3: 'oklch(0.22 0.05 265)',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['IBM Plex Sans', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 20px var(--glow-color)',
        'gold-lg': '0 0 40px oklch(0.78 0.16 75 / 0.28)',
        card: '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
      },
      transitionTimingFunction: {
        'ease-out-custom': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'ease-drawer': 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        'slide-up': 'slideUp 0.2s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        'popover-in': 'popoverIn 0.18s cubic-bezier(0.23, 1, 0.32, 1) forwards',
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px) scale(0.96)' }, '100%': { opacity: '1', transform: 'translateY(0) scale(1)' } },
        popoverIn: { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
export default config;
