// vitest.config.ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
    plugins: [
        // reads tsconfig.json "paths" and makes vite/vitest resolve them
        tsconfigPaths(),
    ],
    resolve: {
        // optional extra safety: make "@" point to ./src
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
    test: {
        globals: true,
        environment: "node", // or "jsdom" if your tests need DOM / File API
        include: ["test/**/*.spec.ts", "test/**/*.test.ts"],
        // you can add setupFiles if needed:
        // setupFiles: "./test/setup.ts",
    },
});
