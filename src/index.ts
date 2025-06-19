import type { ViteManifest } from "./types";

// プラグイン設定とマニフェストキャッシュ
let configCache: any = null;
let manifestCache: ViteManifest | null = null;
let manifestLoadPromise: Promise<ViteManifest> | null = null;

/**
 * プラグイン設定を取得する
 */
const getConfig = async () => {
	if (configCache) {
		return configCache;
	}

	try {
		// @ts-ignore - virtual moduleは実行時に解決される
		const configModule = await import("virtual:vite-plugin-assets/config");
		configCache = configModule.default;
		return configCache;
	} catch (error) {
		console.warn("Failed to load plugin config, using defaults:", error);
		return {
			manifestPath: ".vite/manifest.json",
			assetsDir: "assets",
			viteDevServerUrl: "http://localhost:5173",
			buildId: null,
		};
	}
};

/**
 * マニフェストキャッシュをクリアする
 */
export const clearManifestCache = (): void => {
	manifestCache = null;
	manifestLoadPromise = null;
	configCache = null;
};

/**
 * マニフェストを自動的に取得する
 */
const getManifest = async (): Promise<ViteManifest> => {
	// キャッシュがあればそれを返す
	if (manifestCache) {
		return manifestCache;
	}

	// 既にロード中であればそのPromiseを待つ
	if (manifestLoadPromise) {
		return manifestLoadPromise;
	}

	// 開発環境では空のマニフェストを返す
	if (!import.meta.env.PROD) {
		manifestCache = {};
		return manifestCache;
	}

	// 本番環境ではマニフェストを動的にロード
	manifestLoadPromise = loadManifestFromGlob();
	manifestCache = await manifestLoadPromise;
	manifestLoadPromise = null;
	return manifestCache;
};

/**
 * import.meta.globを使用してマニフェストを動的にロード
 */
const loadManifestFromGlob = async (): Promise<ViteManifest> => {
	try {
		const config = await getConfig();
		const manifestPath = config.manifestPath;

		// import.meta.globを使用してマニフェストを動的にインポート
		const manifestModules = import.meta.glob("/**/*.json", { eager: false });

		// マニフェストファイルを探す
		const manifestKey = Object.keys(manifestModules).find(
			(key) => key.endsWith(manifestPath) || key.includes("manifest.json")
		);

		if (!manifestKey) {
			console.warn(`Manifest file not found. Searched for: ${manifestPath}`);
			return {};
		}

		const manifestModule = (await manifestModules[manifestKey]()) as { default: ViteManifest };
		return manifestModule.default || {};
	} catch (error) {
		console.error("Failed to load manifest:", error);
		return {};
	}
};

/**
 * アセットのパスを解決する（オプション不要）
 */
export const resolveAssetPath = async (assetName: string): Promise<string> => {
	const config = await getConfig();

	// 開発環境かどうかを判定
	const isDev = !import.meta.env.PROD;

	if (isDev) {
		// 開発環境: Vite開発サーバーのURLを返す
		const normalizedAsset = assetName.startsWith("/") ? assetName.slice(1) : assetName;
		return `${config.viteDevServerUrl}/${normalizedAsset}`;
	}

	// 本番環境: マニフェストからハッシュ化されたファイル名を解決
	const manifest = await getManifest();
	const publicPath = `/${config.assetsDir}`;

	const manifestEntry = manifest[assetName];
	if (!manifestEntry) {
		console.warn(`Asset not found in manifest: ${assetName}`);
		return `${publicPath}/${assetName}`;
	}

	return `${publicPath}/${manifestEntry.file}`;
};

/**
 * エントリーポイントのアセット（JS, CSS）を取得する（オプション不要）
 */
export const getEntryAssets = async (
	entryName: string
): Promise<{ js: string[]; css: string[] }> => {
	const config = await getConfig();
	const publicPath = `/${config.assetsDir}`;

	const js: string[] = [];
	const css: string[] = [];

	// 開発環境かどうかを判定
	const isDev = !import.meta.env.PROD;

	if (isDev) {
		// 開発環境: エントリーポイントのJSファイルのみ返す
		const path = await resolveAssetPath(entryName);
		js.push(path);
		return { js, css };
	}

	// 本番環境: マニフェストから関連するすべてのアセットを取得
	const manifest = await getManifest();

	const processEntry = (entryPath: string) => {
		const entry = manifest[entryPath];
		if (!entry) return;

		// JSファイルを追加
		js.push(`${publicPath}/${entry.file}`);

		// CSSファイルを追加
		if (entry.css) {
			entry.css.forEach((cssFile) => {
				css.push(`${publicPath}/${cssFile}`);
			});
		}

		// インポートされているモジュールも処理
		if (entry.imports) {
			entry.imports.forEach((importPath) => {
				processEntry(importPath);
			});
		}
	};

	processEntry(entryName);

	// 重複を除去
	return {
		js: [...new Set(js)],
		css: [...new Set(css)],
	};
};

// 型定義のエクスポート
export type { ViteManifest } from "./types";
