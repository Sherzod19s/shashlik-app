/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAF7F2',
        surface: '#FFFFFF',
        surface2: '#F5F0E6',
        border: {
          DEFAULT: '#E8E2D8',
          strong: '#D4CCBE',
        },
        ink: {
          DEFAULT: '#1F1B17',
          2: '#6B5F4F',
          3: '#9C8F7E',
        },
        ember: {
          DEFAULT: '#B5421E',
          dark: '#8B3216',
          light: '#FFF1E9',
        },
        ok: {
          DEFAULT: '#2D6B4F',
          light: '#E6F2EC',
        },
        warn: {
          DEFAULT: '#C68E17',
          light: '#FBF3DD',
        },
        info: {
          DEFAULT: '#1F4E8C',
          light: '#E6EEF8',
        },
        danger: '#A8351A',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
      },
      animation: {
        'slide-up': 'slideUp 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s',
        'toast-in': 'toastIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        toastIn: { from: { opacity: '0', transform: 'translate(-50%, 20px)' }, to: { opacity: '1', transform: 'translate(-50%, 0)' } },
      },
    },
  },
  plugins: [],
};
