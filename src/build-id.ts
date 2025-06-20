import { randomBytes } from "node:crypto";
import type { Plugin, PluginOption, UserConfig } from "vite";

export interface VitePluginBuildIdOptions {
	/**
	 * Whether to generate build ID during build process
	 * Default: true
	 */
	enabled?: boolean;
}

// Plugin factory that generates unique build IDs and injects them into the build
export const buildIdPlugin = (options: VitePluginBuildIdOptions = {}): PluginOption => {
	const buildIdEnabled = options.enabled !== false;

	// Store the generated build ID for this build session
	let currentBuildId: string | undefined;

	const plugin: Plugin = {
		name: "vite-plugin-build-id",
		apply: "build",

		config(config: UserConfig) {
			if (buildIdEnabled) {
				// Generate a unique build ID for this build session
				currentBuildId = generateBuildId();
				// Inject the build ID as a compile-time constant accessible via import.meta.env
				config.define = {
					...config.define,
					"import.meta.env.BUILD_ID": JSON.stringify(currentBuildId),
				};
			}
		},

		buildStart() {
			if (buildIdEnabled && currentBuildId) {
				// Log the build ID for debugging and deployment tracking
				console.log(`Build ID: ${currentBuildId}`);
			}
		},
	};

	return plugin;
};

/**
 * Generate a cryptographically secure build ID
 * Uses 16 bytes of random data encoded as base64url for URL-safe usage
 */
const generateBuildId = (): string => {
	// Generate cryptographically secure 16-byte random value and encode as base64url
	return randomBytes(16).toString("base64url");
};
