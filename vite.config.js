import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        start: true,
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
