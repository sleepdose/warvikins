import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        crimsonText: ['Crimson Text', 'serif'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        gold: { 
          DEFAULT: 'hsl(var(--gold))', 
          light: '#f0c040', 
          dark: '#c89020' 
        },
        stone: { DEFAULT: 'hsl(var(--stone))' },
        crimson: { DEFAULT: 'hsl(var(--crimson))' },
        forest: { DEFAULT: 'hsl(var(--forest))' },
        parchment: { DEFAULT: 'hsl(var(--parchment))' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        shimmer: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 0 0 hsl(43 90% 50% / 0.4)',
            filter: 'brightness(1)',
          },
          '50%': { 
            boxShadow: '0 0 20px 4px hsl(43 90% 50% / 0.2)',
            filter: 'brightness(1.1)',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        attackFlash: {
          '0%, 100%': { opacity: '0' },
          '10%': { opacity: '1', background: 'hsl(0 70% 50% / 0.3)' },
          '20%': { opacity: '0' },
          '30%': { opacity: '1', background: 'hsl(0 70% 50% / 0.2)' },
          '40%': { opacity: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 2s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        attackFlash: 'attackFlash 0.5s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
