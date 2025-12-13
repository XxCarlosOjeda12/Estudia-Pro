/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#8b5cf6',
        'primary-focus': '#7c3aed',
        secondary: '#10b981',
        accent: '#f59e0b',
        'dark-bg': '#0f172a',
        'dark-card': '#1e293b',
        'light-bg': '#f1f5f9',
        'light-card': '#ffffff',
        'light-border': '#e2e8f0', // Slate 200
        'dark-border': '#334155'  // Slate 700
      }
    }
  },
  plugins: []
}
