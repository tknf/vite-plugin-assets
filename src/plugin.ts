import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import type { Plugin } from "vite";

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
	 * マニフェストに追加のメタデータを含めるかどうか
	 * デフォルト: false
	 */
	includeMetadata?: boolean;
	/**
	 * マニフェストファイルのパス（ビルド後の相対パス）
	 * デフォルト: ".vite/manifest.json"
	 */
	manifestPath?: string;
	/**
	 * アセットの出力ディレクトリ
	 * デフォルト: "assets"
	 */
	assetsDir?: string;
	/**
	 * 開発サーバーオプション（Viteのserverオプションと同じ）
	 */
	server?: {
		/**
		 * サーバーのホスト
		 * デフォルト: "localhost"
		 */
		host?: string | boolean;
		/**
		 * サーバーのポート
		 * デフォルト: 5173
		 */
		port?: number;
		/**
		 * HTTPSを使用するかどうか
		 * デフォルト: false
		 */
		https?: boolean;
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

export const assetsPlugin = (options: VitePluginAssetsOptions = {}): Plugin => {
	const {
		buildId = {},
		includeMetadata = false,
		manifestPath = ".vite/manifest.json",
		assetsDir = "assets",
		server = {},
	} = options;
	const buildIdEnabled = buildId.enabled !== false;

	let currentBuildId: string | undefined;
	let resolvedServerConfig: any = {};

	return {
		name: "vite-plugin-assets",

		// Viteの設定を変更
		config(config) {
			// アセット出力ディレクトリを設定
			if (!config.build) config.build = {};
			if (!config.build.assetsDir) {
				config.build.assetsDir = assetsDir;
			}

			// サーバー設定を統合
			if (!config.server) config.server = {};
			Object.assign(config.server, server);

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

			return config;
		},

		// 解決された設定を保存
		configResolved(config) {
			resolvedServerConfig = config.server;
		},

		// ビルド開始時にビルドIDを生成
		buildStart() {
			if (buildIdEnabled) {
				currentBuildId = generateBuildId(buildId);
				console.log(`Generated build ID: ${currentBuildId}`);
			}
		},

		// バーチャルモジュールの解決
		resolveId(id) {
			if (id === VIRTUAL_CONFIG_ID) {
				return RESOLVED_VIRTUAL_CONFIG_ID;
			}
		},

		// バーチャルモジュールの内容を提供
		load(id) {
			if (id === RESOLVED_VIRTUAL_CONFIG_ID) {
				// サーバーURLを構築
				const protocol = resolvedServerConfig?.https ? "https" : "http";
				const host =
					resolvedServerConfig?.host === true
						? "0.0.0.0"
						: resolvedServerConfig?.host || "localhost";
				const port = resolvedServerConfig?.port || 5173;
				const viteDevServerUrl = `${protocol}://${host}:${port}`;

				const config = {
					manifestPath,
					assetsDir,
					viteDevServerUrl,
					buildId: currentBuildId || null,
				};
				return `export default ${JSON.stringify(config, null, 2)}`;
			}
		},

		// マニフェストにメタデータを追加
		generateBundle(_, bundle) {
			if (!includeMetadata || !currentBuildId) return;

			// manifest.jsonを探す
			for (const [fileName, asset] of Object.entries(bundle)) {
				if (fileName.endsWith("manifest.json") && asset.type === "asset") {
					const manifest = JSON.parse(asset.source as string);

					// メタデータを追加
					manifest._metadata = {
						buildId: currentBuildId,
						buildTime: new Date().toISOString(),
					};

					// 更新されたマニフェストを設定
					asset.source = JSON.stringify(manifest, null, 2);
				}
			}
		},
	};
};

export default assetsPlugin;
