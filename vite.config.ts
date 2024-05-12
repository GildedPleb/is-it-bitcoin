import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import wasm from "vite-plugin-wasm";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    wasm(),
    nodePolyfills({
      protocolImports: true,
    }),
  ],
  optimizeDeps: {
    include: [
      "bip39",
      "bitcoinjs-lib",
      "bip32",
      "tiny-secp256k1",
      "buffer",
      "lru-cache",
    ],
  },
  resolve: {
    alias: {
      buffer: "buffer", // Ensures that imports/requires of 'buffer' are aliased to the 'buffer' package
    },
  },
  base: "/is-it-bitcoin/",
});
