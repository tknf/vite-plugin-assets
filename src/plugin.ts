import type { PluginOption } from "vite";
import { buildIdPlugin, type VitePluginBuildIdOptions } from "./build-id";
import { hotReloadPlugin, type VitePluginHotReloadOptions } from "./hot-reload";
import { assetsPipelinePlugin, type VitePluginAssetsPipelineOptions } from "./pipeline";

export interface VitePluginAssetsOptions {
	/**
	 * Build ID generation options
	 */
	buildId?: Partial<VitePluginBuildIdOptions>;
	/**
	 * Asset pipeline options for managing asset processing and bundling
	 */
	pipeline?: Partial<VitePluginAssetsPipelineOptions> & {
		enabled?: boolean;
	};
	/**
	 * Hot reload options for development server auto-reload functionality
	 */
	hotReload?: Partial<VitePluginHotReloadOptions> & {
		enabled?: boolean;
	};
}

// Default glob pattern for asset entry points
const DEFAULT_ENTRY = "src/assets/**/*.{js,ts,css,scss,sass,less,styl}";
// Default output directory for built assets
const DEFAULT_ASSETS_DIR = "assets";
// Default distribution directory
const DEFAULT_OUT_DIR = "dist";
// Default file patterns for hot reload monitoring
const DEFAULT_HOT_RELOAD_ENTRY = ["src/**/*.ts", "src/**/*.tsx"];

// Main plugin factory function that orchestrates build ID, pipeline, and hot reload plugins
const assetsPlugin = (options: VitePluginAssetsOptions = {}): PluginOption => {
	const {
		buildId = {
			enabled: true,
		},
		pipeline = {
			entry: DEFAULT_ENTRY,
			outDir: DEFAULT_OUT_DIR,
			assetsDir: DEFAULT_ASSETS_DIR,
			enabled: true,
		},
		hotReload = { entry: DEFAULT_HOT_RELOAD_ENTRY, ignore: [], enabled: true },
	} = options;

	// Collect enabled plugins based on configuration
	const plugins: PluginOption[] = [];

	// Add build ID plugin if enabled (default: true)
	if (buildId.enabled !== false) {
		plugins.push(buildIdPlugin({ enabled: true }));
	}

	// Add asset pipeline plugin if enabled (default: true)
	if (pipeline.enabled !== false) {
		plugins.push(
			assetsPipelinePlugin({
				entry: pipeline.entry || DEFAULT_ENTRY,
				outDir: pipeline.outDir || DEFAULT_OUT_DIR,
				assetsDir: pipeline.assetsDir || DEFAULT_ASSETS_DIR,
			})
		);
	}

	// Add hot reload plugin if enabled (default: true)
	if (hotReload.enabled !== false) {
		// Normalize pipeline entries to array format
		const pipelineEntry = pipeline.entry
			? Array.isArray(pipeline.entry)
				? pipeline.entry
				: [pipeline.entry]
			: [];
		// Normalize hot reload entries to array format
		const hotReloadEntry = hotReload.entry
			? Array.isArray(hotReload.entry)
				? hotReload.entry
				: [hotReload.entry]
			: DEFAULT_HOT_RELOAD_ENTRY;
		// Combine hot reload and pipeline entries for comprehensive monitoring
		plugins.push(
			hotReloadPlugin({
				entry: [...hotReloadEntry, ...pipelineEntry],
				ignore: hotReload.ignore || [],
			})
		);
	}

	return plugins;
};

export default assetsPlugin;
