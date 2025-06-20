import fs from "node:fs";
import path from "node:path";
import picomatch from "picomatch";
import { normalizePath, type PluginOption, type ResolvedConfig } from "vite";
import { normalizeGlobPattern } from "./path";

export interface VitePluginAssetsPipelineOptions {
	/**
	 * Glob patterns for asset entry points to be processed by Vite
	 * Default: "src/assets/**\/*.{js,ts,css,scss,sass,less,styl}"
	 */
	entry: string | string[];
	/**
	 * Output directory for built assets
	 * Default: "dist"
	 */
	outDir: string;
	/**
	 * Directory name for static assets within the output directory
	 * Default: "assets"
	 */
	assetsDir: string;
}

// Plugin that automatically discovers and configures asset entry points for Vite
export const assetsPipelinePlugin = (options: VitePluginAssetsPipelineOptions): PluginOption => {
	const { entry, outDir, assetsDir } = options;
	const plugin: PluginOption = {
		name: "vite-plugin-assets-pipeline",

		// Configure Vite with discovered asset entry points
		async configResolved(config: ResolvedConfig) {
			const viteConfig = config as any;

			// Discover asset entry points by scanning filesystem
			const patterns = Array.isArray(entry) ? entry : [entry];
			const normalizedPatterns = patterns.map((pattern) =>
				normalizeGlobPattern(pattern, config.root)
			);
			const matcher = picomatch(normalizedPatterns, { dot: true });
			const detectedEntries = new Set<string>();
			await scanFiles(config.root, matcher, detectedEntries);

			if (detectedEntries.size > 0) {
				const entries = Array.from(detectedEntries);

				// Initialize Vite environments configuration if not present
				if (!viteConfig.environments) {
					viteConfig.environments = {};
				}
				if (!viteConfig.environments.client) {
					viteConfig.environments.client = {};
				}
				if (!viteConfig.environments.client.build) {
					viteConfig.environments.client.build = {};
				}

				// Configure client build settings
				const clientBuild = viteConfig.environments.client.build;
				if (!clientBuild.outDir) {
					clientBuild.outDir = outDir;
				}
				if (!clientBuild.assetsDir) {
					clientBuild.assetsDir = assetsDir;
				}

				// Enable manifest generation for asset path resolution
				clientBuild.manifest = true;

				// Configure Rollup input entries
				if (!clientBuild.rollupOptions) {
					clientBuild.rollupOptions = {};
				}
				const clientInput = clientBuild.rollupOptions.input;

				// Merge discovered entries with existing input configuration
				if (Array.isArray(clientInput)) {
					clientBuild.rollupOptions.input = [...clientInput, ...entries];
				} else if (typeof clientInput === "string") {
					clientBuild.rollupOptions.input = [clientInput, ...entries];
				} else {
					clientBuild.rollupOptions.input = entries;
				}
			}
		},
	};

	return plugin;
};

// Recursively scan filesystem to find files matching the given patterns
const scanFiles = async (
	root: string,
	matcher: (file: string) => boolean,
	detectedEntries: Set<string>
): Promise<void> => {
	// Recursive directory scanning function
	async function scan(currentDir: string): Promise<void> {
		try {
			const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = path.join(currentDir, entry.name);

				if (entry.isDirectory()) {
					// Skip hidden directories and node_modules for performance
					if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
						await scan(fullPath);
					}
				} else if (entry.isFile()) {
					const relativePath = normalizePath(path.relative(root, fullPath));

					// Test file against glob patterns
					if (matcher(relativePath)) {
						try {
							// Add matching file to entry points
							detectedEntries.add(relativePath);
						} catch (error) {
							// Gracefully handle files that can't be processed
							console.warn(`Failed to process file ${relativePath}:`, error);
						}
					}
				}
			}
		} catch (error) {
			console.warn(`Failed to scan directory ${currentDir}:`, error);
		}
	}

	await scan(root);
};
