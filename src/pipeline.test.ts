import fs from "node:fs";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Plugin, ResolvedConfig } from "vite";
import { assetsPipelinePlugin, type VitePluginAssetsPipelineOptions } from "./pipeline";

// Mock fs operations for testing scanFiles functionality
vi.mock("node:fs", () => ({
	default: {
		promises: {
			readdir: vi.fn(),
		},
	},
}));

describe("assetsPipelinePlugin", () => {
	const mockReaddir = vi.mocked(fs.promises.readdir);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("creates plugin with correct name", () => {
		const options: VitePluginAssetsPipelineOptions = {
			entry: "src/assets/**/*.{js,ts,css}",
			outDir: "dist",
			assetsDir: "assets",
		};
		const plugin = assetsPipelinePlugin(options);

		expect(plugin).toBeDefined();
		if (typeof plugin === "object" && plugin && "name" in plugin) {
			expect(plugin.name).toBe("vite-plugin-assets-pipeline");
		}
	});

	test("has configResolved method", () => {
		const options: VitePluginAssetsPipelineOptions = {
			entry: "src/assets/**/*.{js,ts,css}",
			outDir: "dist",
			assetsDir: "assets",
		};
		const plugin = assetsPipelinePlugin(options) as Plugin;

		expect(plugin).toHaveProperty("configResolved");
	});

	describe("configResolved", () => {
		test("configures client environment when entries are found", async () => {
			// Mock file system structure
			mockReaddir.mockImplementation(async (dir: any) => {
				if (dir === "/test/project") {
					return [
						{ name: "src", isDirectory: () => true, isFile: () => false },
						{ name: "node_modules", isDirectory: () => true, isFile: () => false },
					] as any;
				}
				if (dir === "/test/project/src") {
					return [
						{ name: "assets", isDirectory: () => true, isFile: () => false },
						{ name: "components", isDirectory: () => true, isFile: () => false },
					] as any;
				}
				if (dir === "/test/project/src/assets") {
					return [
						{ name: "main.ts", isDirectory: () => false, isFile: () => true },
						{ name: "styles.css", isDirectory: () => false, isFile: () => true },
					] as any;
				}
				if (dir === "/test/project/src/components") {
					return [{ name: "Button.tsx", isDirectory: () => false, isFile: () => true }] as any;
				}
				return [] as any;
			});

			const options: VitePluginAssetsPipelineOptions = {
				entry: "src/assets/**/*.{js,ts,css}",
				outDir: "dist",
				assetsDir: "assets",
			};
			const plugin = assetsPipelinePlugin(options) as Plugin;

			const config: ResolvedConfig = {
				root: "/test/project",
			} as any;

			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				await plugin.configResolved(config);
			}

			expect(config).toHaveProperty("environments");
			expect(config.environments).toHaveProperty("client");
			expect(config.environments.client).toHaveProperty("build");
			expect(config.environments.client.build).toMatchObject({
				outDir: "dist",
				assetsDir: "assets",
				manifest: true,
			});
			expect(config.environments.client.build.rollupOptions?.input).toEqual(
				expect.arrayContaining(["src/assets/main.ts", "src/assets/styles.css"])
			);
		});

		test("handles array of entry patterns", async () => {
			// Mock file system for multiple patterns
			mockReaddir.mockImplementation(async (dir: any) => {
				if (dir === "/test/project") {
					return [{ name: "src", isDirectory: () => true, isFile: () => false }] as any;
				}
				if (dir === "/test/project/src") {
					return [
						{ name: "scripts", isDirectory: () => true, isFile: () => false },
						{ name: "styles", isDirectory: () => true, isFile: () => false },
					] as any;
				}
				if (dir === "/test/project/src/scripts") {
					return [
						{ name: "app.js", isDirectory: () => false, isFile: () => true },
						{ name: "utils.js", isDirectory: () => false, isFile: () => true },
					] as any;
				}
				if (dir === "/test/project/src/styles") {
					return [
						{ name: "main.css", isDirectory: () => false, isFile: () => true },
						{ name: "theme.scss", isDirectory: () => false, isFile: () => true },
					] as any;
				}
				return [] as any;
			});

			const options: VitePluginAssetsPipelineOptions = {
				entry: ["src/scripts/**/*.js", "src/styles/**/*.css"],
				outDir: "dist",
				assetsDir: "assets",
			};
			const plugin = assetsPipelinePlugin(options) as Plugin;

			const config: ResolvedConfig = {
				root: "/test/project",
			} as any;

			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				await plugin.configResolved(config);
			}

			expect(config.environments?.client?.build?.rollupOptions?.input).toEqual(
				expect.arrayContaining([
					"src/scripts/app.js",
					"src/scripts/utils.js",
					"src/styles/main.css",
				])
			);
		});

		test("merges with existing rollupOptions input (array)", async () => {
			mockReaddir.mockImplementation(async (dir: any) => {
				if (dir === "/test/project") {
					return [{ name: "src", isDirectory: () => true, isFile: () => false }] as any;
				}
				if (dir === "/test/project/src") {
					return [{ name: "assets", isDirectory: () => true, isFile: () => false }] as any;
				}
				if (dir === "/test/project/src/assets") {
					return [{ name: "vendor.js", isDirectory: () => false, isFile: () => true }] as any;
				}
				return [] as any;
			});

			const options: VitePluginAssetsPipelineOptions = {
				entry: "src/assets/**/*.js",
				outDir: "dist",
				assetsDir: "assets",
			};
			const plugin = assetsPipelinePlugin(options) as Plugin;

			const config: ResolvedConfig = {
				root: "/test/project",
				environments: {
					client: {
						build: {
							rollupOptions: {
								input: ["src/main.ts"],
							},
						},
					},
				},
			} as any;

			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				await plugin.configResolved(config);
			}

			expect(config.environments?.client?.build?.rollupOptions?.input).toEqual([
				"src/main.ts",
				"src/assets/vendor.js",
			]);
		});

		test("merges with existing rollupOptions input (string)", async () => {
			mockReaddir.mockImplementation(async (dir: any) => {
				if (dir === "/test/project") {
					return [{ name: "src", isDirectory: () => true, isFile: () => false }] as any;
				}
				if (dir === "/test/project/src") {
					return [{ name: "assets", isDirectory: () => true, isFile: () => false }] as any;
				}
				if (dir === "/test/project/src/assets") {
					return [{ name: "vendor.js", isDirectory: () => false, isFile: () => true }] as any;
				}
				return [] as any;
			});

			const options: VitePluginAssetsPipelineOptions = {
				entry: "src/assets/**/*.js",
				outDir: "dist",
				assetsDir: "assets",
			};
			const plugin = assetsPipelinePlugin(options) as Plugin;

			const config: ResolvedConfig = {
				root: "/test/project",
				environments: {
					client: {
						build: {
							rollupOptions: {
								input: "src/main.ts",
							},
						},
					},
				},
			} as any;

			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				await plugin.configResolved(config);
			}

			expect(config.environments?.client?.build?.rollupOptions?.input).toEqual([
				"src/main.ts",
				"src/assets/vendor.js",
			]);
		});

		test("does nothing when no entries are found", async () => {
			mockReaddir.mockResolvedValue([] as any);

			const options: VitePluginAssetsPipelineOptions = {
				entry: "src/nonexistent/**/*.js",
				outDir: "dist",
				assetsDir: "assets",
			};
			const plugin = assetsPipelinePlugin(options) as Plugin;

			const config: ResolvedConfig = {
				root: "/test/project",
			} as any;

			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				await plugin.configResolved(config);
			}

			expect(config.environments).toBeUndefined();
		});

		test("skips hidden directories and node_modules", async () => {
			mockReaddir.mockImplementation(async (dir: any) => {
				if (dir === "/test/project") {
					return [
						{ name: ".git", isDirectory: () => true, isFile: () => false },
						{ name: ".vscode", isDirectory: () => true, isFile: () => false },
						{ name: "node_modules", isDirectory: () => true, isFile: () => false },
						{ name: "src", isDirectory: () => true, isFile: () => false },
					] as any;
				}
				if (dir === "/test/project/src") {
					return [{ name: "app.js", isDirectory: () => false, isFile: () => true }] as any;
				}
				return [] as any;
			});

			const options: VitePluginAssetsPipelineOptions = {
				entry: "**/*.js",
				outDir: "dist",
				assetsDir: "assets",
			};
			const plugin = assetsPipelinePlugin(options) as Plugin;

			const config: ResolvedConfig = {
				root: "/test/project",
			} as any;

			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				await plugin.configResolved(config);
			}

			// Should not include files from hidden directories or node_modules
			expect(config.environments?.client?.build?.rollupOptions?.input).toEqual(["src/app.js"]);
		});

		test("handles readdir errors gracefully", async () => {
			mockReaddir.mockRejectedValue(new Error("Permission denied"));
			const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			const options: VitePluginAssetsPipelineOptions = {
				entry: "src/**/*.js",
				outDir: "dist",
				assetsDir: "assets",
			};
			const plugin = assetsPipelinePlugin(options) as Plugin;

			const config: ResolvedConfig = {
				root: "/test/project",
			} as any;

			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				await plugin.configResolved(config);
			}

			expect(consoleWarnSpy).toHaveBeenCalledWith(
				expect.stringContaining("Failed to scan directory"),
				expect.any(Error)
			);
			expect(config.environments).toBeUndefined();

			consoleWarnSpy.mockRestore();
		});

		test("preserves existing outDir and assetsDir if already set", async () => {
			mockReaddir.mockImplementation(async (dir: any) => {
				if (dir === "/test/project") {
					return [{ name: "src", isDirectory: () => true, isFile: () => false }] as any;
				}
				if (dir === "/test/project/src") {
					return [{ name: "main.js", isDirectory: () => false, isFile: () => true }] as any;
				}
				return [] as any;
			});

			const options: VitePluginAssetsPipelineOptions = {
				entry: "src/**/*.js",
				outDir: "dist",
				assetsDir: "assets",
			};
			const plugin = assetsPipelinePlugin(options) as Plugin;

			const config: ResolvedConfig = {
				root: "/test/project",
				environments: {
					client: {
						build: {
							outDir: "custom-out",
							assetsDir: "custom-assets",
						},
					},
				},
			} as any;

			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				await plugin.configResolved(config);
			}

			expect(config.environments?.client?.build?.outDir).toBe("custom-out");
			expect(config.environments?.client?.build?.assetsDir).toBe("custom-assets");
		});

		test("handles files that can't be processed", async () => {
			mockReaddir.mockImplementation(async (dir: any) => {
				if (dir === "/test/project") {
					return [{ name: "src", isDirectory: () => true, isFile: () => false }] as any;
				}
				if (dir === "/test/project/src") {
					return [
						{ name: "corrupted.js", isDirectory: () => false, isFile: () => true },
						{ name: "valid.js", isDirectory: () => false, isFile: () => true },
					] as any;
				}
				return [] as any;
			});

			const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			const options: VitePluginAssetsPipelineOptions = {
				entry: "src/**/*.js",
				outDir: "dist",
				assetsDir: "assets",
			};
			const plugin = assetsPipelinePlugin(options) as Plugin;

			const config: ResolvedConfig = {
				root: "/test/project",
			} as any;

			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				await plugin.configResolved(config);
			}

			// Should still process valid files
			expect(config.environments?.client?.build?.rollupOptions?.input).toEqual(
				expect.arrayContaining(["src/corrupted.js", "src/valid.js"])
			);

			consoleWarnSpy.mockRestore();
		});

		test("handles empty entry array", async () => {
			const options: VitePluginAssetsPipelineOptions = {
				entry: [],
				outDir: "dist",
				assetsDir: "assets",
			};
			const plugin = assetsPipelinePlugin(options) as Plugin;

			const config: ResolvedConfig = {
				root: "/test/project",
			} as any;

			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				await plugin.configResolved(config);
			}

			expect(config.environments).toBeUndefined();
		});

		test("creates environments structure when none exists", async () => {
			mockReaddir.mockImplementation(async (dir: any) => {
				if (dir === "/test/project") {
					return [{ name: "src", isDirectory: () => true, isFile: () => false }] as any;
				}
				if (dir === "/test/project/src") {
					return [{ name: "app.js", isDirectory: () => false, isFile: () => true }] as any;
				}
				return [] as any;
			});

			const options: VitePluginAssetsPipelineOptions = {
				entry: "src/**/*.js",
				outDir: "dist",
				assetsDir: "assets",
			};
			const plugin = assetsPipelinePlugin(options) as Plugin;

			const config: ResolvedConfig = {
				root: "/test/project",
				// No environments property initially
			} as any;

			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				await plugin.configResolved(config);
			}

			expect(config).toHaveProperty("environments");
			expect(config.environments).toHaveProperty("client");
			expect(config.environments.client).toHaveProperty("build");
		});
	});
});
