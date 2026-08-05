import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// SVG Icon (กล่องรายงานสีฟ้า) สำหรับ PWA โดยไม่ต้องมีไฟล์ภาพในเครื่อง
const pwaIconDataUri = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><rect width="512" height="512" rx="110" fill="%232563eb"/><path d="M160 140h192M160 210h192M160 280h120" stroke="%23ffffff" stroke-width="32" stroke-linecap="round"/><rect x="120" y="80" width="272" height="352" rx="24" fill="none" stroke="%23ffffff" stroke-width="28"/><circle cx="330" cy="350" r="40" fill="%2322c55e"/></svg>`

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'PX Daily Report',
        short_name: 'PX Report',
        description: 'ระบบบันทึกรายงานยอดฝากขายประจำวัน',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: pwaIconDataUri,
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: pwaIconDataUri,
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
