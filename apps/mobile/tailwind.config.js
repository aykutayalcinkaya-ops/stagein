/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        dark: '#0A0A0A',
        card: '#1A1A1A',
        border: '#2A2A2A',
        muted: '#666666',
        primary: '#6C47FF',
        accent: '#FF6B35',
        text: '#FFFFFF',
        'text-secondary': '#CCCCCC',
      },
    },
  },
  plugins: [],
}
