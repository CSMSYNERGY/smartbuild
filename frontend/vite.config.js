import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // forward to your existing Express server during dev
      "/api": "http://localhost:3000",
      "/sso": "http://localhost:3000",
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  // IMPORTANT: app will be mounted under /app on your server
  base: "/app/",
});
