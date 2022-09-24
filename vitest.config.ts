import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["src/test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
	},
});
