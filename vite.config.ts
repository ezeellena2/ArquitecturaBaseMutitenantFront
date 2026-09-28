import path from "node:path";
import process from "node:process";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";

// Aspire inyecta la URL de la Api con WithReference. Esto corre en Node (el proxy), no en el navegador.
const apiTarget =
  process.env.services__api__https__0 ?? process.env.API_HTTPS ?? "https://localhost:7280";

// La Api recibe el Host original, también para los subdominios de *.localtest.me.
// secure: false acepta el certificado de desarrollo.
const backend = { target: apiTarget, changeOrigin: false, secure: false, ws: true };

export function backendProxy(mode: string) {
  return {
    "/api": backend,
    "/account": backend,
    "/connect": backend,
    "/signin-google": backend,
    "/.well-known": backend,
    "/webhooks": backend,
    "/health": backend,
    "/alive": backend,
    ...(mode === "development" ? { "/swagger": backend, "/openapi": backend } : {}),
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  server: {
    port: Number(process.env.PORT ?? 5174),
    strictPort: true,
    allowedHosts: [".localtest.me"],
    proxy: backendProxy(mode),
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    css: false,
    // Claude Code arma sus worktrees dentro de .claude/, así que ahí hay copias enteras del proyecto con sus
    // propios tests. Sin esta exclusión, "npm run test" corre también los de otra sesión y falla por eso.
    exclude: [...configDefaults.exclude, ".claude/**"],
  },
}));
