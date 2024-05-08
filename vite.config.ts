import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["bip39"],
  },
  resolve: {
    alias: {
      buffer: "buffer", // Ensures that imports/requires of 'buffer' are aliased to the 'buffer' package
    },
  },
  base: "/is-it-bitcoin/",
});
