import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true, 
        
        // Đảm bảo server lắng nghe trên tất cả các interface để tunnel truy cập được
    host: true,
  }
})
