import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
    // Use absolute asset URLs (/assets/...) so deep links like /e/<slug> load
    // their JS/CSS correctly. With a relative base ('./') the browser resolves
    // assets against the current route (e.g. /e/assets/...), which 404s and the
    // SPA fallback returns index.html — breaking module/MIME loading on shared
    // referral links. The app is served from the domain root, so '/' is correct.
    base: '/',
    plugins: [react(), cloudflare()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        outDir: 'build',
        // Raise the warning threshold so ci isn't noisy, but keep chunking tight
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks: {
                    // React runtime — tiny, shared across every route
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    // Animation libraries — loaded separately so main chunk stays lean
                    'vendor-gsap': ['gsap'],
                    // UI utilities
                    'vendor-ui': ['lucide-react', 'react-icons', 'clsx'],
                },
            },
        },
    },
});