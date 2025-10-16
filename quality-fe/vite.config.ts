import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
// import * as path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      // "@": path.resolve(__dirname, "src"),
      // "@api": path.resolve(__dirname, "src/api"),
      // "@components": path.resolve(__dirname, "src/components"),
      // "@pages": path.resolve(__dirname, "src/pages"),
      // "@model": path.resolve(__dirname, "src/model"),
    },
  },
});
