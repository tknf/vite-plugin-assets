import path from "node:path";
import picomatch from "picomatch";
import { normalizePath, type PluginOption } from "vite";
import { normalizeGlobPattern } from "./path";

export interface VitePluginHotReloadOptions {
	/**
	 * File patterns to monitor for hot reload
	 * Default: ['src\/\*\*\/\*.ts', 'src\/\*\*\/\*.tsx']
	 */
	entry: string | string[];
	/**
	 * File patterns to ignore during hot reload monitoring
	 */
	ignore: string | string[];
}

// Plugin that provides enhanced hot reload functionality for development
export const hotReloadPlugin = (options: VitePluginHotReloadOptions): PluginOption => {
	// Normalize entry patterns to array format
	const entryPatterns = Array.isArray(options.entry) ? options.entry : [options.entry];

	// Normalize ignore patterns to array format
	const ignorePatterns = Array.isArray(options.ignore) ? options.ignore : [options.ignore];

	// Store project root and pattern matcher
	let root = process.cwd();
	let isMatch: (file: string) => boolean;

	return {
		name: "vite-plugin-hot-reload",
		apply: "serve",

		configResolved(config) {
			// Use Vite's configured root or fallback to current working directory
			root = config.root || process.cwd();

			// Normalize glob patterns relative to project root
			const normalizedEntries = entryPatterns.map((p) => normalizeGlobPattern(p, root));
			const normalizedIgnores = ignorePatterns.map((p) => normalizeGlobPattern(p, root));

			// Create picomatch matcher with entry and ignore patterns
			const matcher = picomatch(normalizedEntries, {
				ignore: normalizedIgnores,
				dot: true,
			});

			// Create file matching function for hot reload checks
			isMatch = (filePath: string) => {
				const rel = normalizePath(path.relative(root, filePath));
				return matcher(rel);
			};
		},

		// Handle file changes for hot module replacement
		async handleHotUpdate({ server, file, ...c }) {
			if (!file) return;

			// Check if the changed file matches our watch patterns
			if (isMatch(file)) {
				// Handle CSS files with targeted updates for better performance
				if (isStyleSheet(file)) {
					// Convert absolute path to root-relative path for HMR
					const relativeFile = normalizePath(path.relative(root, file));
					const filePath = `/${relativeFile}?direct`;
					// Send CSS-specific update to maintain styles without page reload
					server.hot.send({
						type: "update",
						updates: [
							{
								acceptedPath: filePath,
								explicitImportRequired: false,
								isWithinCircularImport: false,
								type: "css-update",
								path: filePath,
								timestamp: c.timestamp,
							},
						],
					});
				} else {
					// Trigger full page reload for non-CSS changes
					server.hot.send({ type: "full-reload" });
				}
				// Return empty array to prevent default HMR behavior
				return [];
			}
		},
	};
};

// Check if a file is a stylesheet based on its extension
const isStyleSheet = (file: string): boolean => {
	return (
		file.endsWith(".css") ||
		file.endsWith(".scss") ||
		file.endsWith(".sass") ||
		file.endsWith(".less") ||
		file.endsWith(".styl")
	);
};
