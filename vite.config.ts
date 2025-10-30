import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  // Production build with demo authentication only
  console.log('Building production version with demo authentication');

  const config = {
    server: {
      host: "::",
      port: 8080
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      }
    },
    build: {
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-core': ['react', 'react-dom', 'react-router-dom']
          }
        }
      }
    },
    define: {
      'global': 'globalThis'
    }
  };

  if (mode === 'development') {
    config.plugins.push(componentTagger());
  }

  return config;
});