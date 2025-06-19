export interface ViteManifest {
	[key: string]: {
		file: string;
		src?: string;
		isEntry?: boolean;
		imports?: string[];
		css?: string[];
		assets?: string[];
	};
}

export interface AssetResolverOptions {
	/**
	 * 環境（development または production）
	 * デフォルトは production
	 */
	environment?: "development" | "production";
	/**
	 * Vite開発サーバーのURL（開発環境用）
	 * デフォルトは http://localhost:5173
	 */
	viteDevServerUrl?: string;
	/**
	 * ビルド済みアセットの公開パス（本番環境用）
	 * デフォルトは /assets
	 */
	publicPath?: string;
}
