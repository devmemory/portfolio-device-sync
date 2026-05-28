import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react(), tailwindcss()],
    build: {
      outDir: "build",
      assetsDir: "app",
      sourcemap: false,
      rolldownOptions: {
        output: {
          minify: {
            compress: {
              dropConsole: command === "build",
            },
          },
          codeSplitting: {
            groups: [
              {
                name: "react",
                test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
              },
              {
                name: "rest",
                test: /node_modules[\\/](axios|@tanstack[\\/]react-query|react-cookie)([\\/]|$)/,
              },
              {
                name: "tailwind",
                test: /[\\/]node_modules[\\/](tailwindcss|@tailwindcss)[\\/]/,
              },
            ],
          },
        },
      },
    },
    server: {
      port: 3000,
      proxy: {
        "/api/local": {
          target: env.VITE_LOCAL_BASE_URL,
          changeOrigin: true,
        },
        "/api": {
          target: env.VITE_CLOUD_BASE_URL,
          changeOrigin: true,
        },
        "/socket.io": {
          target: env.VITE_CLOUD_BASE_URL,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    resolve: {
      alias: {
        src: "/src",
      },
    },
  };
});
