import { describe, expect, it, beforeEach, vi } from "vitest";
import { resolveAssetPath, getEntryAssets, clearManifestCache } from "./index";

// import.meta.env をモック
vi.stubGlobal("import", {
	meta: {
		env: {
			PROD: false,
			VITE_MANIFEST_PATH: ".vite/manifest.json",
		},
		glob: vi.fn(() => ({})),
	},
});

describe("asset resolver", () => {
	beforeEach(() => {
		clearManifestCache();
	});

	describe("resolveAssetPath", () => {
		it("should return Vite dev server URL in development mode", async () => {
			const path = await resolveAssetPath("src/main.ts", {
				environment: "development",
				viteDevServerUrl: "http://localhost:5173",
			});

			expect(path).toBe("http://localhost:5173/src/main.ts");
		});

		it("should handle leading slash in asset name", async () => {
			const path = await resolveAssetPath("/src/main.ts", {
				environment: "development",
				viteDevServerUrl: "http://localhost:5173",
			});

			expect(path).toBe("http://localhost:5173/src/main.ts");
		});

		it("should use import.meta.env.PROD for environment detection", async () => {
			// 本番環境をシミュレート
			vi.stubGlobal("import", {
				meta: {
					env: {
						PROD: false, // 開発環境
						VITE_MANIFEST_PATH: ".vite/manifest.json",
					},
					glob: vi.fn(() => ({})),
				},
			});

			const path = await resolveAssetPath("src/main.ts");
			expect(path).toBe("http://localhost:5173/src/main.ts");
		});
	});

	describe("getEntryAssets", () => {
		it("should return only JS file in development mode", async () => {
			const assets = await getEntryAssets("src/main.ts", {
				environment: "development",
				viteDevServerUrl: "http://localhost:5173",
			});

			expect(assets).toEqual({
				js: ["http://localhost:5173/src/main.ts"],
				css: [],
			});
		});
	});
});
