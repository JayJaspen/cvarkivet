import type { Config } from 'tailwindcss';

/**
 * Färgskala: salviagrön mot benvit, med terrakotta som accent.
 * Dov och lugn snarare än skrikig – folk anförtror oss sina CV.
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Primärfärg – salvia
        brand: {
          50: '#F2F6F3',
          100: '#E8EFE9',
          200: '#CFDFD3',
          300: '#AAC6B2',
          400: '#7CA588',
          500: '#5C8A6A',
          600: '#4F7A5C',
          700: '#3F6249',
          800: '#344E3B',
          900: '#2C4132',
        },
        // Accent – varm terrakotta, används sparsamt
        accent: {
          50: '#FBF3EE',
          100: '#F6E3D7',
          200: '#EBC3AB',
          300: '#DFA079',
          400: '#D28A5C',
          500: '#C97B4A',
          600: '#B0653A',
          700: '#8D5030',
          800: '#70412B',
          900: '#5C3726',
        },
        // Neutraler med varm ton i stället för Tailwinds kalla grå
        sand: {
          50: '#FAFAF7',
          100: '#F4F4EF',
          200: '#E9E9E1',
          300: '#D7D7CC',
          400: '#B0B0A3',
          500: '#87877A',
          600: '#65655B',
          700: '#4C4C45',
          800: '#35352F',
          900: '#2A2E2B',
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(42, 46, 43, 0.04), 0 1px 3px rgba(42, 46, 43, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
