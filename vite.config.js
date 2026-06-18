import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative asset URLs make the build work from any GitHub Pages project path,
// e.g. https://USER.github.io/REPOSITORY/ as well as a custom domain.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
