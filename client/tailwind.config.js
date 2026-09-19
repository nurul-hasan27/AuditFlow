/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#0f172a',
          hover: '#1e293b',
          foreground: '#ffffff',
          50: '#f8fafc',
          100: '#f1f5f9',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        audit: {
          pending: {
            bg: '#f1f5f9',
            text: '#475569',
            border: '#cbd5e1'
          },
          uploaded: {
            bg: '#eff6ff',
            text: '#1d4ed8',
            border: '#bfdbfe'
          },
          underReview: {
            bg: '#fefce8',
            text: '#a16207',
            border: '#fef08a'
          },
          correctionRequired: {
            bg: '#fef2f2',
            text: '#b91c1c',
            border: '#fecaca'
          },
          approved: {
            bg: '#f0fdf4',
            text: '#15803d',
            border: '#bbf7d0'
          }
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
