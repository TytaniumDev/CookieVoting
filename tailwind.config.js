/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                // Admin Theme - Based on screenshot (deep dark purple/gray)
                surface: {
                    DEFAULT: '#1e1e2e',
                    secondary: '#2a2a3a',
                    tertiary: '#3a3a4a',
                },
                background: {
                    DEFAULT: '#12121a',
                    secondary: '#1a1a24',
                },
                primary: {
                    50: '#f5f3ff',
                    100: '#ede9fe',
                    200: '#ddd6fe',
                    300: '#c4b5fd',
                    400: '#a78bfa',
                    500: '#8b5cf6',
                    600: '#7c3aed',
                    700: '#6d28d9',
                    800: '#5b21b6',
                    900: '#4c1d95',
                    950: '#2e1065',
                },
                // Existing theme colors from variables.css
                accent: {
                    DEFAULT: '#dc2626',
                    hover: '#b91c1c',
                },
                success: '#16a34a',
                danger: '#ef4444',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
            },
            borderRadius: {
                sm: '0.25rem',
                md: '0.375rem',
                lg: '0.5rem',
                xl: '0.75rem',
                '2xl': '1rem',
            },
        },
    },
    plugins: [],
};
