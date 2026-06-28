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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "vendor-react";
            }

            if (id.includes("leaflet") || id.includes("react-leaflet")) {
              return "vendor-map";
            }

            if (id.includes("lucide-react")) {
              return "vendor-icons";
            }

            return "vendor";
          }

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
