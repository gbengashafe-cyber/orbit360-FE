/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

// Orbit 360 neutrals (DESIGN.md §2). `gray` and `slate` both point here so existing grey classes
// across the app pick up the slightly blue-biased neutrals without editing every page.
const orbitGray = {
  0: '#FFFFFF',
  50: '#F6F8FB',
  100: '#EEF1F6',
  200: '#E2E7EF',
  300: '#CBD3DF',
  400: '#98A3B5',
  500: '#6B7689',
  600: '#4D5769',
  700: '#363F4F',
  800: '#222937',
  900: '#141A26',
  950: '#0B0F17',
};

const statusTone = (name) => ({
  DEFAULT: `var(--status-${name})`,
  bg: `var(--status-${name}-bg)`,
  line: `var(--status-${name}-line)`,
});

module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        // DESIGN.md §3 type scale
        caption: ['12px', { lineHeight: '16px' }],
        label: ['13px', { lineHeight: '18px', fontWeight: '500' }],
        body: ['14px', { lineHeight: '20px' }],
        'card-title': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'section-title': ['18px', { lineHeight: '28px', fontWeight: '600' }],
        'page-title': ['24px', { lineHeight: '32px', fontWeight: '600', letterSpacing: '-0.01em' }],
      },
      borderRadius: {
        lg: 'var(--radius)', // 8px: cards, dialogs, popovers, toasts
        md: 'calc(var(--radius) - 2px)', // 6px: buttons, inputs
        sm: 'calc(var(--radius) - 4px)', // 4px: badges, menu items
      },
      boxShadow: {
        overlay: 'var(--shadow-overlay)',
      },
      colors: {
        gray: orbitGray,
        slate: orbitGray,
        brand: {
          50: 'hsl(var(--brand-50))',
          100: 'hsl(var(--brand-100))',
          600: 'hsl(var(--brand-600))',
          700: 'hsl(var(--brand-700))',
          DEFAULT: 'hsl(var(--brand-600))',
          indigo: '#14069A', // logo and charts only
        },
        status: {
          pending: statusTone('pending'),
          info: statusTone('info'),
          success: statusTone('success'),
          danger: statusTone('danger'),
          neutral: statusTone('neutral'),
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
