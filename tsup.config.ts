import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["src/index.ts", "src/plugin.ts"],
		external: ["vite"],
		format: "esm",
		splitting: false,
		dts: true,
		onSuccess: async () => {
			const src = resolve("src", "env.d.ts");
			const dest = resolve("dist", "env.d.ts");
			copyFileSync(src, dest);
		},
	},
]);
