import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#2E5090",
                secondary: "#1F4E78",
                accent: "#5B9BD5",
                success: "#28A745",
                warning: "#FFC107",
                danger: "#DC3545",
            },
        },
    },
    plugins: [],
};
export default config;
