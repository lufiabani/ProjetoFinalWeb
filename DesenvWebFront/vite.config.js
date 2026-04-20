// vite.config.js — React + React Compiler (Babel) conforme setup do projeto.
// Safari: aviso "WebSocket … suspension" = separador em segundo plano (HMR do Vite). VITE_DISABLE_HMR=true desliga o HMR.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

const raizProjeto = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, raizProjeto, '')
  const desligarHmr = env.VITE_DISABLE_HMR === 'true'

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
    server: desligarHmr ? { hmr: false } : undefined,
  }
})
