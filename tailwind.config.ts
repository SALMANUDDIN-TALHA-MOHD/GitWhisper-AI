import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./pages/**/*.{ts,tsx}','./components/**/*.{ts,tsx}','./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#06080f',
        surface:  '#0d1117',
        surface2: '#161b27',
        surface3: '#1e2638',
        accent:   '#6366f1',
        accent2:  '#818cf8',
        accent3:  '#a5b4fc',
        gold:     '#c9a84c',
        gold2:    '#e6c97a',
      },
      fontFamily: {
        // Use CSS variables set by Next.js font optimization
        sans:    ['var(--font-inter)', 'Inter', 'sans-serif'],
        display: ['var(--font-syne)', 'Syne', 'sans-serif'],
        mono:    ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
