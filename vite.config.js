import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      "/api":       { target:"http://localhost:3001", changeOrigin:true },
      "/socket.io": { target:"http://localhost:3001", ws:true, changeOrigin:true },
    },
  },
  build: {
    outDir:"dist", emptyOutDir:true,
    rollupOptions: {
      output: {
        manualChunks: {
          react:  ["react","react-dom"],
          charts: ["recharts"],
          icons:  ["lucide-react"],
          pdf:    ["jspdf","jspdf-autotable"],
          socket: ["socket.io-client"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["react","react-dom","recharts","lucide-react","jspdf","jspdf-autotable","socket.io-client"],
  },
});
