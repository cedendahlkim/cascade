import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom"],
          "vendor-markdown": ["react-markdown", "remark-gfm"],
          "vendor-syntax": ["react-syntax-highlighter"],
          "vendor-socket": ["socket.io-client"],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3031",
      "/socket.io": {
        target: "http://localhost:3031",
        ws: true,
      },
    },
  },
});
