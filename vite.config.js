
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // === CRITICAL FIX FOR VERCEL ===
  // Vercel injects variables into `process.env` during build.
  // `loadEnv` sometimes only looks at local .env files.
  // We must check BOTH `process.env` (Server/Vercel) and `env` (Local .env).
  const apiKey = process.env.VITE_API_KEY || process.env.API_KEY || env.VITE_API_KEY || env.API_KEY;

  console.log("Build detected API Key:", apiKey ? "Yes (Hidden)" : "No (Missing)");

  return {
    plugins: [react()],
    define: {
      // Inject the key into the browser code
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})
