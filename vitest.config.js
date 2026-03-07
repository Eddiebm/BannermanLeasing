import { defineConfig } from "vite";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.js", "**/*.spec.js"],
    globals: true,
  },
});
