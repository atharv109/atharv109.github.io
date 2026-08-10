import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "src",
  publicDir: "../public",
  plugins: [react()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    target: "es2022",
    cssMinify: false,
    minify: false,
    rollupOptions: {
      external: (id) =>
        id === "three" ||
        id === "react" ||
        id === "react-dom/client" ||
        id.startsWith("react/"),
    },
  },
});
