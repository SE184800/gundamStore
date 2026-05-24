import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
