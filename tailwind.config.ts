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
          DEFAULT: '#0D1B3E',
          dark: '#070E21',
          light: '#132040',
          mid: '#1A2B50',
          soft: '#243560',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E8D48B',
          dark: '#8B6914',
          soft: '#F0E0A0',
          dim: '#7A5C10',
        },
        surface: {
          DEFAULT: '#132040',
          2: '#1A2B50',
          3: '#243560',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['IBM Plex Sans', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C9A84C 0%, #E8D48B 50%, #C9A84C 100%)',
        'navy-gradient': 'linear-gradient(180deg, #070E21 0%, #0D1B3E 100%)',
        'card-gradient': 'linear-gradient(145deg, #1A2B50 0%, #132040 100%)',
      },
      boxShadow: {
        gold: '0 0 20px rgba(201, 168, 76, 0.15)',
        'gold-lg': '0 0 40px rgba(201, 168, 76, 0.25)',
        card: '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
export default config;
