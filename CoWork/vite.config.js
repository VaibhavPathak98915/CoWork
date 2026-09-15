import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Spring Boot backend lives in ../Template/App and serves /user on 8080.
    proxy: {
      "/user": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
