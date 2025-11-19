/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'lexiom-primary': '#0F4C81',
        'lexiom-secondary': '#C9A24A',
        'lexiom-text': '#111827',
        'lexiom-background': '#F8FAFC',
        'primary': '#0F4C81',
        'accent': '#C9A24A',
        'bg': '#F8FAFC',
        'surface': '#111827',
        'neutral-1': '#6B7280',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'manrope': ['Manrope', 'Inter', 'sans-serif'],
        'headline': ['Inter', 'sans-serif'],
        'body': ['Manrope', 'Inter', 'sans-serif'],
      },
      spacing: {
        '8px': '8px',
        '16px': '16px',
        '24px': '24px',
        '32px': '32px',
        '40px': '40px',
        '48px': '48px',
        '56px': '56px',
        '64px': '64px',
      },
      borderRadius: {
        'card': '12px'
      },
      boxShadow: {
        'lexiom': '0 2px 8px rgba(0,0,0,0.08)',
        'lexiom-lg': '0 4px 16px rgba(0,0,0,0.12)',
        'lexiom-xl': '0 8px 32px rgba(0,0,0,0.16)',
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
      },
    },
  },
  plugins: [],
};
