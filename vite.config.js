import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static, dependency-light SPA. `base: "./"` keeps asset paths relative so the
// build works when served from any path (Vercel, a subfolder, file preview).
export default defineConfig({
  base: "./",
  plugins: [react()],
});
