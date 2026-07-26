import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

export default defineConfig({
    plugins: [
        react(),
        babel({ presets: [reactCompilerPreset()] })
    ],
    build: {
        target: 'chrome69'
    },
    server: {
        host: '0.0.0.0',
        proxy: {
            '/api.php': {
                target: 'http://localhost',
                changeOrigin: true,
                rewrite: () => '/smartsoft/micarrito/api.php',
            },
        },
    },
    base: './'
})
