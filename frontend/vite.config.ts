import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const apiProxy =
    process.env.API_PROXY ||
    loadEnv(mode, process.cwd(), "API_").API_PROXY ||
    "http://127.0.0.1:8000";
  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: "127.0.0.1",
      port: 5178,
      strictPort: true,
      watch: { ignored: ["**/test-results/**", "**/playwright-report/**"] },
      proxy: {
        "/api": apiProxy,
        "/health": apiProxy,
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            charts: ["recharts"],
            vendor: [
              "react",
              "react-dom",
              "react-router-dom",
              "@tanstack/react-query",
            ],
          },
        },
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
    },
  };
});
