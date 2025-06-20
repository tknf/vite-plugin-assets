import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import assets from "../../src/plugin";

export default defineConfig({
	plugins: [cloudflare(), assets()],
});
