import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // For LOCAL development - uncomment this line:
  base: "/",

  // For PRODUCTION (Vercel) - uncomment this line and comment out local:
  // base: "/your-vercel-project-name/",

  server: {
    port: 5174,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 900,
  },
});
