/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background-start': '#080721',
        'background-end': '#0F0F2D',
        'card': '#1A1A2F',
        'conky': {
          orange: '#FFB86C',
          blue: '#8BE9FD',
          green: '#50FA7B',
          purple: '#BD93F9',
          red: '#FF5555',
          pink: '#FF79C6',
          'dark-bg': '#282A36',
          'light-bg': '#44475A',
        }
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
      },
    },
  },
  safelist: [
    'grid-cols-1',
    'grid-cols-2',
    'grid-cols-3',
    'grid-cols-4',
    {
      pattern: /bg-(conky)-(orange|blue|green|purple|red|pink|dark-bg|light-bg)/,
      variants: ['hover', 'focus', 'active'],
    },
    {
      pattern: /text-(conky)-(orange|blue|green|purple|red|pink|dark-bg|light-bg)/,
      variants: ['hover', 'focus', 'active'],
    },
  ],
  plugins: [],
}
