/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./features/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                slate: {
                    850: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
                // Primary: Rich Purple-Blue for trust & professionalism
                primary: {
                    50: '#f0f4ff',
                    100: '#e0eaff',
                    200: '#c7d7fe',
                    300: '#a5b8fc',
                    400: '#8b92f8',
                    500: '#6366f1',  // Main brand color
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                },
                // Secondary: Vibrant Teal for energy & innovation
                secondary: {
                    50: '#f0fdfa',
                    100: '#ccfbf1',
                    200: '#99f6e4',
                    300: '#5eead4',
                    400: '#2dd4bf',
                    500: '#14b8a6',  // Accent color
                    600: '#0d9488',
                    700: '#0f766e',
                    800: '#115e59',
                    900: '#134e4a',
                },
                // Accent: Warm coral/orange for CTAs & highlights
                accent: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#f97316',  // Eye-catching CTA
                    600: '#ea580c',
                    700: '#c2410c',
                    800: '#9a3412',
                    900: '#7c2d12',
                },
                // Success: Fresh green
                success: {
                    500: '#10b981',
                    600: '#059669',
                }
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #6366f1 0%, #8b92f8 100%)',
                'gradient-secondary': 'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)',
                'gradient-accent': 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                'gradient-hero': 'linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)',
            }
        },
    },
    plugins: [],
}
