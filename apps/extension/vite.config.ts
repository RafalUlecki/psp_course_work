import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { buildSync } from "esbuild";
import { defineConfig, loadEnv, type Plugin } from "vite";

const copyStaticExtensionFilesPlugin = (): Plugin => ({
  name: "copy-static-extension-files",
  closeBundle() {
    const distDir = resolve(__dirname, "dist");
    mkdirSync(distDir, { recursive: true });
    copyFileSync(
      resolve(__dirname, "manifest.src.json"),
      resolve(distDir, "manifest.json"),
    );
    copyFileSync(
      resolve(__dirname, "options.html"),
      resolve(distDir, "options.html"),
    );
  },
});

const bundleBackgroundPlugin = (apiBase: string): Plugin => ({
  name: "bundle-background",
  closeBundle() {
    buildSync({
      entryPoints: [resolve(__dirname, "src/background.ts")],
      outfile: resolve(__dirname, "dist/background.js"),
      bundle: true,
      format: "iife",
      target: "chrome114",
      define: {
        "import.meta.env.VITE_HIT_RATE_API_BASE": JSON.stringify(apiBase),
      },
    });
  },
});

const bundleOptionsPlugin = (): Plugin => ({
  name: "bundle-options",
  closeBundle() {
    buildSync({
      entryPoints: [resolve(__dirname, "src/options.ts")],
      outfile: resolve(__dirname, "dist/options.js"),
      bundle: true,
      format: "iife",
      target: "chrome114",
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "VITE_");
  const apiBase = env.VITE_HIT_RATE_API_BASE || "http://localhost:3000";

  return {
    plugins: [
      react(),
      bundleBackgroundPlugin(apiBase),
      bundleOptionsPlugin(),
      copyStaticExtensionFilesPlugin(),
    ],
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
  };
});
