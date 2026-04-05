import { defineConfig, searchForWorkspaceRoot } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  assetsInclude: ["**/*.wasm"],
  worker: {
    format: "es",
  },
  plugins: [react()],
  build: {
    target: "esnext",
    sourcemap: true,
    chunkSizeWarningLimit: 1500,
  },
  optimizeDeps: {
    exclude: ["@provablehq/wasm"],
  },
  server: {
    fs: {
      allow: [searchForWorkspaceRoot(process.cwd()), "../sdk"],
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
