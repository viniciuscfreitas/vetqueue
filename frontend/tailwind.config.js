/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Fonts
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Typescale enxuto: máximo 5 tamanhos únicos
        'h1': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.025em', fontWeight: '700' }], // 20px
        'h2': ['1.125rem', { lineHeight: '1.3', letterSpacing: '-0.025em', fontWeight: '600' }], // 18px
        'body': ['1rem', { lineHeight: '1.55', letterSpacing: '0', fontWeight: '400' }], // 16px
        'small': ['0.875rem', { lineHeight: '1.45', letterSpacing: '0', fontWeight: '400' }], // 14px
        'xs': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.025em', fontWeight: '500' }], // 12px
      },
      // Breakpoints baseados no conteúdo e melhor aproveitamento da tela
      screens: {
        'mobile-portrait': '480px',
        'mobile-landscape': '768px',
        'tablet-portrait': '834px',
        'tablet-landscape': '1024px',
        'laptop': '1280px',
        'desktop': '1440px',
        'wide': '1920px',
      },
      colors: {
        // Sistema de tokens OKLCH (L Ch H)
        // Light mode como padrão
        'bg': {
          0: 'oklch(0.98 0.01 260)', // Fundo página
          1: 'oklch(0.96 0.01 260)', // Seções
          2: 'oklch(0.94 0.01 260)', // Cards
          3: 'oklch(0.90 0.01 260)', // Controles elevados
        },
        'text': {
          1: 'oklch(0.18 0.02 260)', // Títulos
          2: 'oklch(0.28 0.01 260)', // Corpo
          'muted': 'oklch(0.40 0.01 260)', // Metadados
        },
        'primary': {
          DEFAULT: 'oklch(0.58 0.16 260)', // Azul principal
          'hover': 'oklch(0.54 0.16 260)', // Hover: -L
          'pressed': 'oklch(0.50 0.16 260)', // Active: -L adicional
        },
        'semantic': {
          'success': 'oklch(0.62 0.14 140)', // Verde
          'warning': 'oklch(0.68 0.15 85)',  // Amarelo
          'danger': 'oklch(0.55 0.18 25)',   // Vermelho
          'info': 'oklch(0.60 0.12 220)',     // Azul claro
        },
        // Cores específicas do sistema
        'vet-blue': {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        'japanese': {
          'gofun': '#FFFFFC',
          'shironeri': '#F3F3F2',
          'shiraume': '#E5E4E6',
        },
        'text-dark': {
          'charcoal': '#121212',
          'space': '#252525',
        },
      },
      boxShadow: {
        // Sistema de elevação composto (highlight + soft + strong)
        'elev-1': '0 1px 0 rgba(255,255,255,0.08) inset, 0 2px 6px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.15)',
        'elev-2': '0 1px 0 rgba(255,255,255,0.08) inset, 0 6px 16px rgba(0,0,0,0.08), 0 3px 6px rgba(0,0,0,0.15)',
        'elev-3': '0 1px 0 rgba(255,255,255,0.08) inset, 0 16px 32px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.15)',
        // Cavidade para inputs
        'inset': '0 1px 0 rgba(255,255,255,0.08) inset, 0 -1px 0 rgba(0,0,0,0.15) inset',
        // Estados de interação
        'elev-1-hover': '0 1px 0 rgba(255,255,255,0.12) inset, 0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.20)',
        'elev-2-hover': '0 1px 0 rgba(255,255,255,0.12) inset, 0 8px 20px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.20)',
        // Compatibilidade com código existente
        'material-1': '0 8.06px 8.06px 0 rgba(78, 78, 78, 0.04)',
        'card': '0 2px 8px 0 rgba(0, 0, 0, 0.1)',
        'hover': '0 4px 16px 0 rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
        'input': '6px',
        'modal': '16px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 1s ease-in-out',
      },
    },
  },
  plugins: [],
}
