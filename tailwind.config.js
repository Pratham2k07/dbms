/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        jklu: {
          bg: '#FBFBF9',
          card: '#FFFFFF',
          'card-subtle': '#F5F4F0',
          dark: '#121316',
          'dark-surface': '#1A1B20',
          'dark-muted': '#282A32',
          orange: '#E8590C',
          'orange-deep': '#D9480F',
          'orange-light': '#FFF4E6',
          'orange-vibrant': '#FF6B18',
          blue: '#4F70B0',
          'blue-slate': '#6686C6',
          'blue-deep': '#355389',
          'blue-navy': '#243B66',
          'blue-light': '#EDF3FC',
          'blue-soft': '#F2F6FC',
          border: '#E8E6DF',
          'border-dark': '#32353E',
          text: '#141518',
          muted: '#636A78',
          faint: '#8E95A2',
          green: '#2B8A3E',
          'green-light': '#EBFBEE',
          red: '#C92A2A',
          'red-light': '#FFF5F5',
          amber: '#D97706',
          'amber-light': '#FFFBEB'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
        editorial: ['Outfit', 'Plus Jakarta Sans', 'sans-serif']
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'float': '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'sheet': '0 -8px 30px rgba(0, 0, 0, 0.08)',
        'focus-orange': '0 0 0 3px rgba(232, 89, 12, 0.2)'
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.35)', opacity: '0.2' },
        },
        routeDash: {
          '0%': { strokeDashoffset: '40' },
          '100%': { strokeDashoffset: '0' },
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'route-dash': 'routeDash 1.5s linear infinite',
      }
    },
  },
  plugins: [],
}
