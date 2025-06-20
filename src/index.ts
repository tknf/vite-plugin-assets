import type { Manifest } from "vite";

// Cache for Vite's manifest.json to avoid repeated file system reads
let manifestCache: Manifest | null = null;

// Testing utilities for manifest cache management
export const __resetManifestCache = () => {
	manifestCache = null;
};

export const __setManifestCache = (manifest: Manifest | null) => {
	manifestCache = manifest;
};

// Load and cache Vite's build manifest for asset path resolution
export const loadManifest = (): Manifest | null => {
	// Return cached manifest if available
	if (manifestCache) {
		return manifestCache;
	}

	// Use Vite's glob import to find manifest.json in various dist subdirectories
	const MANIFEST = import.meta.glob<{ default: Manifest }>(
		[
			"/dist/.vite/manifest.json",
			"/dist/*/.vite/manifest.json",
			"/dist/*/*/.vite/manifest.json",
			"/dist/*/*/*/.vite/manifest.json",
		],
		{ eager: true }
	);

	// Cache and return the first manifest found
	for (const [, module] of Object.entries(MANIFEST)) {
		manifestCache = module.default;
		return module.default;
	}

	return null;
};

// Resolve asset paths for development and production environments
export const asset = (path: string, baseUrl = "/"): string => {
	const isProd = import.meta.env.PROD;

	if (isProd) {
		// In production, use manifest to resolve hashed asset paths
		const manifest = loadManifest();
		if (manifest) {
			// Remove leading slash for manifest lookup
			const asset = manifest[path.replace(/^\//, "")];
			if (asset) {
				// Return absolute or relative path based on input format
				return path.startsWith("/") ? `${ensureTrailingSlash(baseUrl)}${asset.file}` : asset.file;
			}
		}
		// Return empty string if asset not found in manifest
		return "";
	} else {
		// In development, return the original path for Vite dev server
		return path;
	}
};

// Utility to ensure a path ends with a trailing slash for URL joining
const ensureTrailingSlash = (path: string): string => {
	return path.endsWith("/") ? path : `${path}/`;
};
