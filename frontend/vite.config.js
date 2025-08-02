var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tanstackRouter from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { searchForWorkspaceRoot } from "vite";
import path from "path";
import wasm from "vite-plugin-wasm";
var cache = new Map();
function cachingMiddlewarePlugin() {
    return {
        name: "vite:custom-cache-middleware",
        configureServer: function (server) {
            server.middlewares.use(function (req, res, next) {
                var _a;
                if (req.method !== "GET" || !((_a = req.url) === null || _a === void 0 ? void 0 : _a.startsWith("/synology"))) {
                    return next();
                }
                var cached = cache.get(req.url);
                if (cached) {
                    console.log("Cache hit for:", req.url);
                    res.writeHead(200, {
                        "Content-Type": cached.contentType || "application/json",
                        "X-Cached": "true",
                    });
                    res.end(cached.body);
                    return;
                }
                var originalWrite = res.write;
                var originalEnd = res.end;
                var chunks = [];
                res.write = function (chunk) {
                    var args = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        args[_i - 1] = arguments[_i];
                    }
                    if (chunk)
                        chunks.push(Buffer.from(chunk));
                    return originalWrite.apply(this, __spreadArray([chunk], args, true));
                };
                res.end = function (chunk) {
                    var _a;
                    var args = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                        args[_i - 1] = arguments[_i];
                    }
                    if (chunk)
                        chunks.push(Buffer.from(chunk));
                    console.log("Request ended");
                    var body = Buffer.concat(chunks);
                    cache.set(req.url, {
                        body: body,
                        contentType: (_a = res.getHeader("Content-Type")) === null || _a === void 0 ? void 0 : _a.toString(),
                    });
                    return originalEnd.apply(this, __spreadArray([chunk], args, true));
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
    },
    envDir: searchForWorkspaceRoot(__dirname),
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@common": path.resolve(__dirname, "../common/src")
        },
        preserveSymlinks: false,
    },
    worker: {
        format: 'es',
        plugins: function () { return [wasm()]; }
    },
});
