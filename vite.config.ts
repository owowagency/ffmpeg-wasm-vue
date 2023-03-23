import checker from 'vite-plugin-checker';
import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig(({mode}) => ({
    plugins: [
        vue(),
        checker({
            eslint: {lintCommand: 'eslint "./src/**/*.{ts,vue}"'},
            overlay: {initialIsOpen: false},
            vueTsc: true,
        }),
        {
            name: 'configure-response-headers',
            configureServer: (s) => {
                s.middlewares
                    .use((req, res, next) => {
                        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

                        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

                        next();
                    });
            },
        },
    ],
    resolve: {
        alias: {
            '@/': '/src/',
        },
    },
    server: {
        headers: {
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
        },
        watch: {
            ignored: ['**/cypress/**'],
        },
    },
}));
