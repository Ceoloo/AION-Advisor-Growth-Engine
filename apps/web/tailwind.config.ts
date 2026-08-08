import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
    // Include the shared UI package so its Tailwind classes are generated.
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0b1220',
          elevated: '#111a2e',
        },
        brand: {
          blue: '#2563eb',
          bright: '#3b82f6',
          green: '#10b981',
          gold: '#d4af37',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
