import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this project from /the-journey/, not the domain root.
  base: "/the-journey/"
});
