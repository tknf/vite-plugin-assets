import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import { assetsPlugin } from "../src/plugin";

export default defineConfig({
	plugins: [
		cloudflare(),
		assetsPlugin({
			server: {
				port: 3000,
			},
		}),
	],
});
