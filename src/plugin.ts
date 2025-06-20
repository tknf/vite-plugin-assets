import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import type { Plugin, PluginOption, ResolvedConfig, UserConfig } from "vite";

export interface BuildIdOptions {
	/**
	 * ビルドIDを保存するファイルパス
	 */
	outputPath?: string;
}

export interface VitePluginAssetsOptions {
	/**
	 * ビルドID生成オプション
	 */
	buildId?: BuildIdOptions & {
		/**
		 * ビルドIDを生成するかどうか
		 * デフォルト: true
		 */
		enabled?: boolean;
	};
	/**
	 * マニフェストファイルのパス（ビルド後の相対パス）
	 * デフォルト: ".vite/manifest.json"
	 */
	manifest?: {
		/**
		 * マニフェストファイルのパス（ビルド後の相対パス）
		 * デフォルト: ".vite/manifest.json"
		 */
		path?: string;
		/**
		 * マニフェストに追加のメタデータを含めるかどうか
		 * デフォルト: false
		 */
		includeMetadata?: boolean;
	};
}

/**
 * セキュアなビルドIDを生成する
 */
const generateBuildId = (options: BuildIdOptions = {}): string => {
	// 暗号学的に安全な16バイトのランダム値を生成し、Base64URLエンコード
	const buildId = randomBytes(16).toString("base64url");

	// ビルドIDをファイルに保存
	if (options.outputPath) {
		const content = JSON.stringify({ buildId, timestamp: new Date().toISOString() }, null, 2);
		writeFileSync(options.outputPath, content, "utf8");
	}

	return buildId;
};

const VIRTUAL_CONFIG_ID = "virtual:vite-plugin-assets/config";
const RESOLVED_VIRTUAL_CONFIG_ID = `\0${VIRTUAL_CONFIG_ID}`;
const DEFAULT_MANIFEST_PATH = ".vite/manifest.json";
const DEFAULT_ASSETS_DIR = "assets";
const DEFAULT_OUT_DIR = "dist";

export const assetsPlugin = (options: VitePluginAssetsOptions = {}): PluginOption => {
	const {
		buildId = {},
		manifest = {
			path: DEFAULT_MANIFEST_PATH,
			includeMetadata: false,
		},
	} = options;
	const buildIdEnabled = buildId.enabled !== false;

	let currentBuildId: string | undefined;
	let resolvedConfig: ResolvedConfig | undefined;
	let manifestPath = `/${DEFAULT_OUT_DIR}/${manifest.path || DEFAULT_MANIFEST_PATH}`;

	const plugin = {
		name: "vite-plugin-assets",

		// Viteの設定を変更
		config(config: UserConfig) {
			// 環境変数を設定
			const defines: Record<string, string> = {};

			if (currentBuildId) {
				defines["import.meta.env.BUILD_ID"] = JSON.stringify(currentBuildId);
			}

			if (Object.keys(defines).length > 0) {
				if (!config.define) config.define = {};
				Object.assign(config.define, defines);
			}

			// バーチャルモジュールを最適化から除外
			if (!config.optimizeDeps) config.optimizeDeps = {};
			if (!config.optimizeDeps.exclude) config.optimizeDeps.exclude = [];
			config.optimizeDeps.exclude.push(VIRTUAL_CONFIG_ID);

			// マニフェストの設定
			const outDir = config.build?.outDir || DEFAULT_OUT_DIR;
			manifestPath = `/${outDir}/${manifest.path || DEFAULT_MANIFEST_PATH}`;

			return config;
		},

		// 解決された設定を保存
		configResolved(config: ResolvedConfig) {
			resolvedConfig = config;
		},

		// ビルド開始時にビルドIDを生成
		buildStart() {
			if (buildIdEnabled) {
				currentBuildId = generateBuildId(buildId);
				console.log(`Generated build ID: ${currentBuildId}`);
			}
		},

		// バーチャルモジュールの解決
		resolveId(id: string) {
			if (id === VIRTUAL_CONFIG_ID) {
				return RESOLVED_VIRTUAL_CONFIG_ID;
			}
		},

		// バーチャルモジュールの内容を提供
		load(id: string) {
			if (id === RESOLVED_VIRTUAL_CONFIG_ID) {
				// サーバーURLを構築
				const protocol = resolvedConfig?.server?.https ? "https" : "http";
				const host =
					resolvedConfig?.server?.host === true
						? "0.0.0.0"
						: resolvedConfig?.server?.host || "localhost";
				const port = resolvedConfig?.server?.port || 5173;
				const viteDevServerUrl = `${protocol}://${host}:${port}`;
				const build = {
					assetsDir: resolvedConfig?.build?.assetsDir || DEFAULT_ASSETS_DIR,
					outDir: resolvedConfig?.build?.outDir || DEFAULT_OUT_DIR,
				};

				const config = {
					manifestPath,
					build,
					viteDevServerUrl,
					buildId: currentBuildId || null,
				};
				return `export default ${JSON.stringify(config, null, 2)}`;
			}
		},

		// マニフェストにメタデータを追加
		generateBundle(_: any, bundle: any) {
			if (!manifest.includeMetadata || !currentBuildId) return;

			// manifest.jsonを探す
			for (const [fileName, asset] of Object.entries(bundle)) {
				if (fileName.endsWith("manifest.json") && (asset as any).type === "asset") {
					const manifest = JSON.parse((asset as any).source as string);

					// メタデータを追加
					manifest._metadata = {
						buildId: currentBuildId,
						buildTime: new Date().toISOString(),
					};

					// 更新されたマニフェストを設定
					(asset as any).source = JSON.stringify(manifest, null, 2);
				}
			}
		},
	};

	return plugin;
};

export default assetsPlugin;
