import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["src/index.ts", "src/plugin.ts"],
		external: ["vite"],
		format: "esm",
		splitting: false,
		dts: true,
	},
]);
