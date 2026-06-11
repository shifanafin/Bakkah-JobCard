import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-bebas)', 'cursive'],
        body:    ['var(--font-geist)', 'system-ui'],
      },
      colors: {
        brand: {
          DEFAULT: '#6B7A28',
          50:  '#f4f6e8',
          100: '#e6ecc8',
          200: '#cad898',
          400: '#8fa037',
          500: '#6B7A28',
          600: '#566020',
          700: '#404a18',
          900: '#1e2208',
        },
        golden: {
          DEFAULT: '#C9A227',
          50:  '#fdf8e6',
          100: '#f9ecc0',
          200: '#f3d87a',
          300: '#e8c040',
          400: '#d9af2a',
          500: '#C9A227',
          600: '#a8841e',
          700: '#856716',
          800: '#614c0f',
          900: '#3d3009',
        },
        surface: {
          DEFAULT: '#111111',
          50:  '#fafafa',
          100: '#f5f5f5',
          700: '#1c1c1c',
          800: '#141414',
          900: '#0a0a0a',
          950: '#050505',
        },
      },
      animation: {
        'fade-up':    'fadeUp 0.5s ease forwards',
        'fade-in':    'fadeIn 0.3s ease forwards',
        'shimmer':    'shimmer 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in':   'slideIn 0.25s ease forwards',
        'ticker':     'ticker 35s linear infinite',
      },
      keyframes: {
        fadeUp:  { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        slideIn: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(0)' } },
        ticker:  { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h32v1H0zM0 0v32h1V0z' fill='%23000000' fill-opacity='0.04'/%3E%3C/svg%3E\")",
        'grid-pattern-dark': "url(\"data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h32v1H0zM0 0v32h1V0z' fill='%23ffffff' fill-opacity='0.03'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}

export default config
