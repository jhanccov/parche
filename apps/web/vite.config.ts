import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'Nunito-ExtraBold.ttf'],
      manifest: {
        name: 'Parche - Comunidades La Salle',
        short_name: 'Parche',
        description: 'Comunidades, mentoría entre pares y retos del territorio para estudiantes La Salle de Colombia y Perú',
        lang: 'es',
        theme_color: '#033259',
        background_color: '#FBF7EE',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          { urlPattern: /\/api\/(communities|challenges|help|events|map|impact|me|universities|skills)/, handler: 'NetworkFirst', options: { cacheName: 'api', networkTimeoutSeconds: 4 } },
          { urlPattern: /tile\.openstreetmap\.org/, handler: 'CacheFirst', options: { cacheName: 'tiles', expiration: { maxEntries: 400, maxAgeSeconds: 7 * 24 * 3600 } } },
        ],
      },
    }),
  ],
  server: { port: 5173, proxy: { '/api': 'http://localhost:4000' } },
  preview: { port: 4173, proxy: { '/api': 'http://localhost:4000' } },
});
