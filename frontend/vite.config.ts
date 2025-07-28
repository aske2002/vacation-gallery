// vite.config.ts
import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tanstackRouter from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { searchForWorkspaceRoot } from "vite";
import path from "path";
import wasm from "vite-plugin-wasm";

const cache = new Map<string, { body: Buffer; contentType?: string }>();

function cachingMiddlewarePlugin(): Plugin {
  return {
    name: "vite:custom-cache-middleware",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.method !== "GET" || !req.url?.startsWith("/synology")) {
          return next();
        }

        const cached = cache.get(req.url);
        if (cached) {
          console.log("Cache hit for:", req.url);
          res.writeHead(200, {
            "Content-Type": cached.contentType || "application/json",
            "X-Cached": "true",
          });
          res.end(cached.body);
          return;
        }

        const originalWrite = res.write;
        const originalEnd = res.end;
        const chunks: Uint8Array[] = [];

        res.write = function (chunk, ...args) {
          if (chunk) chunks.push(Buffer.from(chunk));
          return originalWrite.apply(this, [chunk, ...args]);
        };

        res.end = function (chunk, ...args) {
          if (chunk) chunks.push(Buffer.from(chunk));
          console.log("Request ended");
          const body = Buffer.concat(chunks);
          cache.set(req.url!, {
            body,
            contentType: res.getHeader("Content-Type")?.toString(),
          });
          return originalEnd.apply(this, [chunk, ...args]);
        };

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    wasm(),
    tanstackRouter({ autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    cachingMiddlewarePlugin(), // 👈 Inject the middleware plugin here
  ],
  optimizeDeps: {
    exclude: ["libraw-wasm"]
  },
  server: {
    open: false,
    proxy: {
      "/synology": {
        target: "https://photo.igloo.dk",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/synology/, ""),
        secure: false,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            console.log("Proxying:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log("Target responded:", proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  envDir: searchForWorkspaceRoot(__dirname),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    preserveSymlinks: false,
  },
});
