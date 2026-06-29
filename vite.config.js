import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4800",
        changeOrigin: true,
      },
      "/health": {
        target: "http://127.0.0.1:4800",
        changeOrigin: true,
      },
      '/sapo-admin-api': {
        target: 'https://gundamstorevn.mysapo.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sapo-admin-api/, ''),
        configure: (proxy) => {
          // Sử dụng tài khoản Admin API thật cậu vừa chụp
          const basicAuthHeader = 'Basic NzVkYjZmODJjM2MzNDY1NGJhOGFkYjE5MzVlMGMwN2U6NDRkMGNlNzM3ZDQ1NDFmMzhiNmM4MWVlMzJiYzRlNw==';

          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Authorization', basicAuthHeader);
          });
        },
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            // 1. Ép riêng lõi cứng React & React-DOM lên tháp ưu tiên cao nhất
            if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
              return "vendor-react-core";
            }

            // 2. Tách riêng các thư viện Map
            if (id.includes("leaflet") || id.includes("react-leaflet")) {
              return "vendor-map";
            }

            // 3. Tách riêng hệ thống Icon (để không bị dính vào bộ lọc chữ "react" ở dưới)
            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }

            // 4. Các thư viện phụ trợ React khác (bao gồm cả react-router) nằm ở đây
            if (id.includes("react")) {
              return "vendor-react-helpers";
            }

            // 5. Toàn bộ các gói node_modules còn lại
            return "vendor";
          }

          // --- PHẦN PAGES CỦA CẬU GIỮ NGUYÊN ---
          if (id.includes("/src/pages/admin/")) {
            return "admin";
          }

          if (id.includes("/src/pages/storefront/EventsPage")) {
            return "events-map";
          }

          if (id.includes("/src/pages/storefront/")) {
            return "storefront";
          }
        },
      },
    },
  },
});
