import type { Config } from "tailwindcss";

export default {
  darkMode: ['class', '[data-mode="dark"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff8c00', // Dark orange
          light: '#ffd700',   // Gold
          dark: '#e67e00',    // Slightly darker orange for hover
        },
        danger: {
          DEFAULT: '#DC2626', // Red-600: Clear red
          light: '#F87171',   // Red-400: Soft red
          dark: '#B91C1C',    // Red-700: Deep red
        },
        neutral: {
          DEFAULT: '#222222', // Gray background (was #151515)
          dark: '#1a1a1a',    // Darker gray (was #111111)
          darker: '#111111',  // Even darker gray (was #080808)
        },
        text: {
          DEFAULT: '#ffffff', // White text
          light: '#858585',   // Gray text for secondary content
          dark: '#ffffff',    // White text for dark mode
        },
        surface: {
          light: '#151515',   // Dark surface for consistency
          dark: '#151515',    // Same dark background for dark mode
        },
        accent: {
          DEFAULT: '#ffd700', // Gold
          light: '#ffe24d',   // Lighter gold
          dark: '#e6c200',    // Darker gold
        }
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0,0,0,0.2)',
        'hover': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.15)', // Darkened shadow
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, #ff8c00, #ffd700)',
      },
      borderColor: {
        DEFAULT: '#1e1e1e', // Default border color
      },
      outline: {
        'none': ['0 solid transparent']
      },
      ringColor: {
        DEFAULT: '#333333',
      },
      ringWidth: {
        DEFAULT: '0',
      },
    },
  },
  plugins: [
    function ({ addBase }: { addBase: Function }) {
      addBase({
        '*': { 
          '-webkit-tap-highlight-color': 'rgba(0, 0, 0, 0)', 
          'outline': 'none'
        },
        '*:focus': { 
          'outline': 'none !important',
        },
        '*:active': { 
          'outline': 'none !important',
        },
        'body': {
          '-webkit-tap-highlight-color': 'transparent',
        },
        'a, button, input, textarea, select': {
          '-webkit-tap-highlight-color': 'transparent',
          'outline': 'none !important',
        },
      });
    },
  ],
} satisfies Config;
