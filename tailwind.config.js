/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zoneA: {
          light: '#38bdf8',
          DEFAULT: '#0284c7',
          dark: '#0369a1',
          border: '#0284c7',
          bg: '#e0f2fe'
        },
        zoneB: {
          light: '#fb923c',
          DEFAULT: '#ea580c',
          dark: '#c2410c',
          border: '#ea580c',
          bg: '#ffedd5'
        },
        neutralZone: {
          DEFAULT: '#64748b',
          bg: '#f1f5f9'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-short': 'bounce 0.8s ease-in-out 2',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-a': 'glowA 1.5s ease-in-out infinite alternate',
        'glow-b': 'glowB 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glowA: {
          '0%': { boxShadow: '0 0 15px rgba(2, 132, 199, 0.4)' },
          '100%': { boxShadow: '0 0 35px rgba(2, 132, 199, 0.9)' },
        },
        glowB: {
          '0%': { boxShadow: '0 0 15px rgba(234, 88, 12, 0.4)' },
          '100%': { boxShadow: '0 0 35px rgba(234, 88, 12, 0.9)' },
        }
      }
    },
  },
  plugins: [],
}
