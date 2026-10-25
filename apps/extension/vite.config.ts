import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const copyManifestPlugin = (): Plugin => ({
  name: "copy-manifest",
  closeBundle() {
    const distDir = resolve(__dirname, "dist");
    mkdirSync(distDir, { recursive: true });
    copyFileSync(
      resolve(__dirname, "manifest.src.json"),
      resolve(distDir, "manifest.json"),
    );
  },
});

export default defineConfig({
  plugins: [react(), copyManifestPlugin()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        content: resolve(__dirname, "src/content.tsx"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].js",
      },
    },
  },
});
