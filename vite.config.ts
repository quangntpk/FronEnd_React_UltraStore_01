import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    minify: "esbuild", // Sử dụng esbuild để nén code
    sourcemap: false, // Tắt sourcemap trong production để giảm kích thước
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"], // Tách các thư viện lớn vào chunk riêng
        },
      },
    },
  },
}));