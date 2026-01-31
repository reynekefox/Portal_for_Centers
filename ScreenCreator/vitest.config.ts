/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "client", "src"),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './client/src/test/setup.ts',
        include: ['client/src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
        coverage: {
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'client/src/test/']
        }
    }
})
