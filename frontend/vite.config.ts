import { defineConfig, searchForWorkspaceRoot } from "vite";
import react from "@vitejs/plugin-react-swc";

const isDev = process.env.NODE_ENV !== "production";

export default defineConfig(async () => {
  const plugins: any[] = [react()];

  if (isDev) {
    const mkcert = (await import("vite-plugin-mkcert")).default;
    plugins.push(mkcert());
  }

  return {
    assetsInclude: ["**/*.wasm"],
    worker: {
      format: "es",
    },
    plugins,
    build: {
      target: "esnext",
      sourcemap: true,
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
  };
});
