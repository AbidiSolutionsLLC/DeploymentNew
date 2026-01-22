import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
   server: {
    host: '0.0.0.0',
    port: 3000, // optional, defaults to 5173
  },
  plugins: [react()],
  css: {
    preprocessorOptions: {
      css: {
        additionalData: `@import "./src/index.css";`,
      },
    },
  },
})
