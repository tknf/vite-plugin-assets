import config from "virtual:vite-plugin-assets/config";
import type { Manifest } from "vite";

let manifestCache: Manifest | null = null;

export const loadManifest = (): Manifest | null => {
	if (manifestCache) {
		return manifestCache;
	}

	const manifestPath = config.manifest || "/dist/.vite/manifest.json";
	const MANIFEST = import.meta.glob<{ default: Manifest }>(
		[
			manifestPath,
			"/dist/*/.vite/manifest.json",
			"/dist/*/*/.vite/manifest.json",
			"/dist/*/*/*/.vite/manifest.json",
		],
		{ eager: true }
	);

	for (const [, module] of Object.entries(MANIFEST)) {
		manifestCache = module.default;
		return module.default;
	}

	return null;
};

export const asset = (path: string, baseUrl = "/"): string => {
	const isProd = import.meta.env.PROD;

	if (isProd) {
		const manifest = loadManifest();
		if (manifest) {
			const asset = manifest[path.replace(/^\//, "")];
			return path.startsWith("/") ? `${ensureTrailingSlash(baseUrl)}${asset.file}` : asset.file;
		}
		return "";
	} else {
		return path;
	}
};

const ensureTrailingSlash = (path: string): string => {
	return path.endsWith("/") ? path : `${path}/`;
};
