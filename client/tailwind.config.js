/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#0a0a0a',
        card:    '#111111',
        border:  '#1e1e1e',
        subtle:  '#6b7280',
        primary: '#f0f0f0',
        accent:  '#7c3aed',
        'accent-hover': '#6d28d9',
        success: '#16a34a',
        warning: '#ea580c',
        error:   '#dc2626',
      },
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
