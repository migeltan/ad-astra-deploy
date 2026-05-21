import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(),
  ],
  base: '/ad-astra-deploy/',
  define: {
    global: 'globalThis',
  },
  resolve: {
    dedupe: [
      '@stellar/stellar-sdk',
      '@stellar/stellar-sdk/rpc',
      '@stellar/stellar-base',
    ],
  },
})