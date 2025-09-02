import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        available: 'var(--color-available)',
        unavailable: 'var(--color-unavailable)',
        'trainer-busy': 'var(--color-trainer-busy)',
        'travel-conflict': 'var(--color-travel-conflict)',
        'outside-hours': 'var(--color-outside-hours)',
      },
    },
  },
  plugins: [],
}
export default config
