import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/bidding': {
          target: 'https://bidding2.kr',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/bidding/, ''),
          secure: false,
        },
        '/api/file': {
          target: 'https://file.bidding2.kr',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/file/, ''),
          secure: false, // Bypass SSL verification 
        }
      }
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
