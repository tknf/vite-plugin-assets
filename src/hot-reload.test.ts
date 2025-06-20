import { beforeEach, describe, expect, test, vi } from "vitest";
import { hotReloadPlugin, type VitePluginHotReloadOptions } from "./hot-reload";

// Mock vite's normalizePath
vi.mock("vite", () => ({
	normalizePath: vi.fn((path: string) => path.replace(/\\/g, "/")),
}));

describe("hotReloadPlugin", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("initializes plugin correctly", () => {
		const options: VitePluginHotReloadOptions = {
			entry: "src/**/*.ts",
			ignore: "node_modules",
		};
		const plugin = hotReloadPlugin(options);

		expect(plugin).toBeDefined();
		if (typeof plugin === "object" && plugin && "name" in plugin) {
			expect(plugin.name).toBe("vite-plugin-hot-reload");
		}
		if (typeof plugin === "object" && plugin && "apply" in plugin) {
			expect(plugin.apply).toBe("serve");
		}
	});

	test("accepts multiple entry patterns", () => {
		const options: VitePluginHotReloadOptions = {
			entry: ["src/**/*.ts", "src/**/*.tsx"],
			ignore: [],
		};
		const plugin = hotReloadPlugin(options);

		expect(plugin).toBeDefined();
	});

	test("accepts string ignore pattern", () => {
		const options: VitePluginHotReloadOptions = {
			entry: "src/**/*.ts",
			ignore: "node_modules/**",
		};
		const plugin = hotReloadPlugin(options);

		expect(plugin).toBeDefined();
	});

	test("accepts array of ignore patterns", () => {
		const options: VitePluginHotReloadOptions = {
			entry: "src/**/*.ts",
			ignore: ["node_modules/**", "dist/**"],
		};
		const plugin = hotReloadPlugin(options);

		expect(plugin).toBeDefined();
	});

	describe("configResolved", () => {
		test("sets up file matching with default root", () => {
			const options: VitePluginHotReloadOptions = {
				entry: "src/**/*.ts",
				ignore: [],
			};
			const plugin = hotReloadPlugin(options);

			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				const config = {
					root: undefined, // This should default to process.cwd()
				};
				plugin.configResolved(config as any);
			}

			expect(plugin).toBeDefined();
		});

		test("sets up file matching with custom root", () => {
			const options: VitePluginHotReloadOptions = {
				entry: "src/**/*.ts",
				ignore: "test/**",
			};
			const plugin = hotReloadPlugin(options);

			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				const config = {
					root: "/custom/project/root",
				};
				plugin.configResolved(config as any);
			}

			expect(plugin).toBeDefined();
		});

		test("handles multiple entry and ignore patterns", () => {
			const options: VitePluginHotReloadOptions = {
				entry: ["src/**/*.ts", "lib/**/*.js"],
				ignore: ["**/*.test.*", "node_modules/**"],
			};
			const plugin = hotReloadPlugin(options);

			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				const config = {
					root: "/test/project",
				};
				plugin.configResolved(config as any);
			}

			expect(plugin).toBeDefined();
		});
	});

	describe("handleHotUpdate", () => {
		test("returns early when no file provided", async () => {
			const options: VitePluginHotReloadOptions = {
				entry: "src/**/*.ts",
				ignore: [],
			};
			const plugin = hotReloadPlugin(options);

			// Setup plugin
			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				plugin.configResolved({ root: "/test/project" } as any);
			}

			const mockServer = {
				hot: {
					send: vi.fn(),
				},
			};

			let result: any;
			if (
				plugin &&
				typeof plugin === "object" &&
				"handleHotUpdate" in plugin &&
				typeof plugin.handleHotUpdate === "function"
			) {
				result = await plugin.handleHotUpdate({
					server: mockServer,
					file: undefined,
					timestamp: Date.now(),
				} as any);
			}

			expect(result).toBeUndefined();
			expect(mockServer.hot.send).not.toHaveBeenCalled();
		});

		test("sends full reload for matching TypeScript files", async () => {
			const options: VitePluginHotReloadOptions = {
				entry: "src/**/*.ts",
				ignore: [],
			};
			const plugin = hotReloadPlugin(options);

			// Setup plugin
			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				plugin.configResolved({ root: "/test/project" } as any);
			}

			const mockServer = {
				hot: {
					send: vi.fn(),
				},
			};

			let result: any;
			if (
				plugin &&
				typeof plugin === "object" &&
				"handleHotUpdate" in plugin &&
				typeof plugin.handleHotUpdate === "function"
			) {
				result = await plugin.handleHotUpdate({
					server: mockServer,
					file: "/test/project/src/main.ts",
					timestamp: Date.now(),
				} as any);
			}

			expect(mockServer.hot.send).toHaveBeenCalledWith({ type: "full-reload" });
			expect(result).toEqual([]);
		});

		test("sends CSS update for matching CSS files", async () => {
			const options: VitePluginHotReloadOptions = {
				entry: "src/**/*.css",
				ignore: [],
			};
			const plugin = hotReloadPlugin(options);

			// Setup plugin
			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				plugin.configResolved({ root: "/test/project" } as any);
			}

			const timestamp = Date.now();
			const mockServer = {
				hot: {
					send: vi.fn(),
				},
			};

			let result: any;
			if (
				plugin &&
				typeof plugin === "object" &&
				"handleHotUpdate" in plugin &&
				typeof plugin.handleHotUpdate === "function"
			) {
				result = await plugin.handleHotUpdate({
					server: mockServer,
					file: "/test/project/src/styles.css",
					timestamp,
				} as any);
			}

			expect(mockServer.hot.send).toHaveBeenCalledWith({
				type: "update",
				updates: [
					{
						acceptedPath: "/src/styles.css?direct",
						explicitImportRequired: false,
						isWithinCircularImport: false,
						type: "css-update",
						path: "/src/styles.css?direct",
						timestamp,
					},
				],
			});
			expect(result).toEqual([]);
		});

		test("sends CSS update for SCSS files", async () => {
			const options: VitePluginHotReloadOptions = {
				entry: "src/**/*.scss",
				ignore: [],
			};
			const plugin = hotReloadPlugin(options);

			// Setup plugin
			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				plugin.configResolved({ root: "/test/project" } as any);
			}

			const timestamp = Date.now();
			const mockServer = {
				hot: {
					send: vi.fn(),
				},
			};

			let result: any;
			if (
				plugin &&
				typeof plugin === "object" &&
				"handleHotUpdate" in plugin &&
				typeof plugin.handleHotUpdate === "function"
			) {
				result = await plugin.handleHotUpdate({
					server: mockServer,
					file: "/test/project/src/theme.scss",
					timestamp,
				} as any);
			}

			expect(mockServer.hot.send).toHaveBeenCalledWith({
				type: "update",
				updates: [
					{
						acceptedPath: "/src/theme.scss?direct",
						explicitImportRequired: false,
						isWithinCircularImport: false,
						type: "css-update",
						path: "/src/theme.scss?direct",
						timestamp,
					},
				],
			});
			expect(result).toEqual([]);
		});

		test("handles other stylesheet extensions", async () => {
			const styleFiles = [
				{ file: "style.sass", entry: "**/*.sass" },
				{ file: "theme.less", entry: "**/*.less" },
				{ file: "main.styl", entry: "**/*.styl" },
			];

			for (const { file, entry } of styleFiles) {
				const options: VitePluginHotReloadOptions = {
					entry,
					ignore: [],
				};
				const plugin = hotReloadPlugin(options);

				// Setup plugin
				if (
					plugin &&
					typeof plugin === "object" &&
					"configResolved" in plugin &&
					typeof plugin.configResolved === "function"
				) {
					plugin.configResolved({ root: "/test/project" } as any);
				}

				const timestamp = Date.now();
				const mockServer = {
					hot: {
						send: vi.fn(),
					},
				};

				if (
					plugin &&
					typeof plugin === "object" &&
					"handleHotUpdate" in plugin &&
					typeof plugin.handleHotUpdate === "function"
				) {
					await plugin.handleHotUpdate({
						server: mockServer,
						file: `/test/project/src/${file}`,
						timestamp,
					} as any);
				}

				expect(mockServer.hot.send).toHaveBeenCalledWith({
					type: "update",
					updates: [
						{
							acceptedPath: `/src/${file}?direct`,
							explicitImportRequired: false,
							isWithinCircularImport: false,
							type: "css-update",
							path: `/src/${file}?direct`,
							timestamp,
						},
					],
				});
			}
		});

		test("ignores non-matching files", async () => {
			const options: VitePluginHotReloadOptions = {
				entry: "src/**/*.ts",
				ignore: [],
			};
			const plugin = hotReloadPlugin(options);

			// Setup plugin
			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				plugin.configResolved({ root: "/test/project" } as any);
			}

			const mockServer = {
				hot: {
					send: vi.fn(),
				},
			};

			let result: any;
			if (
				plugin &&
				typeof plugin === "object" &&
				"handleHotUpdate" in plugin &&
				typeof plugin.handleHotUpdate === "function"
			) {
				result = await plugin.handleHotUpdate({
					server: mockServer,
					file: "/test/project/dist/main.js", // This shouldn't match src/**/*.ts
					timestamp: Date.now(),
				} as any);
			}

			expect(mockServer.hot.send).not.toHaveBeenCalled();
			expect(result).toBeUndefined();
		});

		test("ignores files matching ignore patterns", async () => {
			const options: VitePluginHotReloadOptions = {
				entry: "src/**/*.ts",
				ignore: ["**/*.test.ts", "src/ignore/**"],
			};
			const plugin = hotReloadPlugin(options);

			// Setup plugin
			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				plugin.configResolved({ root: "/test/project" } as any);
			}

			const mockServer = {
				hot: {
					send: vi.fn(),
				},
			};

			// Test ignore pattern for test files
			if (
				plugin &&
				typeof plugin === "object" &&
				"handleHotUpdate" in plugin &&
				typeof plugin.handleHotUpdate === "function"
			) {
				await plugin.handleHotUpdate({
					server: mockServer,
					file: "/test/project/src/component.test.ts",
					timestamp: Date.now(),
				} as any);
			}

			expect(mockServer.hot.send).not.toHaveBeenCalled();

			// Test ignore pattern for directory
			if (
				plugin &&
				typeof plugin === "object" &&
				"handleHotUpdate" in plugin &&
				typeof plugin.handleHotUpdate === "function"
			) {
				await plugin.handleHotUpdate({
					server: mockServer,
					file: "/test/project/src/ignore/file.ts",
					timestamp: Date.now(),
				} as any);
			}

			expect(mockServer.hot.send).not.toHaveBeenCalled();
		});

		test("handles Windows-style paths", async () => {
			const options: VitePluginHotReloadOptions = {
				entry: "src/**/*.ts",
				ignore: [],
			};
			const plugin = hotReloadPlugin(options);

			// Setup plugin with Windows-style path (normalized by vite)
			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				plugin.configResolved({ root: "C:/test/project" } as any);
			}

			const mockServer = {
				hot: {
					send: vi.fn(),
				},
			};

			let result: any;
			if (
				plugin &&
				typeof plugin === "object" &&
				"handleHotUpdate" in plugin &&
				typeof plugin.handleHotUpdate === "function"
			) {
				result = await plugin.handleHotUpdate({
					server: mockServer,
					file: "C:/test/project/src/main.ts",
					timestamp: Date.now(),
				} as any);
			}

			expect(mockServer.hot.send).toHaveBeenCalledWith({ type: "full-reload" });
			expect(result).toEqual([]);
		});

		test("handles nested directories", async () => {
			const options: VitePluginHotReloadOptions = {
				entry: "src/**/components/**/*.tsx",
				ignore: [],
			};
			const plugin = hotReloadPlugin(options);

			// Setup plugin
			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				plugin.configResolved({ root: "/test/project" } as any);
			}

			const mockServer = {
				hot: {
					send: vi.fn(),
				},
			};

			let result: any;
			if (
				plugin &&
				typeof plugin === "object" &&
				"handleHotUpdate" in plugin &&
				typeof plugin.handleHotUpdate === "function"
			) {
				result = await plugin.handleHotUpdate({
					server: mockServer,
					file: "/test/project/src/features/auth/components/LoginForm.tsx",
					timestamp: Date.now(),
				} as any);
			}

			expect(mockServer.hot.send).toHaveBeenCalledWith({ type: "full-reload" });
			expect(result).toEqual([]);
		});
	});

	describe("isStyleSheet helper", () => {
		test("correctly identifies stylesheet files", async () => {
			const options: VitePluginHotReloadOptions = {
				entry: "**/*",
				ignore: [],
			};
			const plugin = hotReloadPlugin(options);

			// Setup plugin
			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				plugin.configResolved({ root: "/test/project" } as any);
			}

			const mockServer = {
				hot: {
					send: vi.fn(),
				},
			};

			// Test all stylesheet extensions
			const stylesheetFiles = [
				"styles.css",
				"theme.scss",
				"main.sass",
				"variables.less",
				"components.styl",
			];

			for (const fileName of stylesheetFiles) {
				vi.clearAllMocks();

				if (
					plugin &&
					typeof plugin === "object" &&
					"handleHotUpdate" in plugin &&
					typeof plugin.handleHotUpdate === "function"
				) {
					await plugin.handleHotUpdate({
						server: mockServer,
						file: `/test/project/src/${fileName}`,
						timestamp: Date.now(),
					} as any);
				}

				expect(mockServer.hot.send).toHaveBeenCalledWith(
					expect.objectContaining({
						type: "update",
						updates: expect.arrayContaining([
							expect.objectContaining({
								type: "css-update",
							}),
						]),
					})
				);
			}
		});

		test("correctly identifies non-stylesheet files", async () => {
			const options: VitePluginHotReloadOptions = {
				entry: "**/*",
				ignore: [],
			};
			const plugin = hotReloadPlugin(options);

			// Setup plugin
			if (
				plugin &&
				typeof plugin === "object" &&
				"configResolved" in plugin &&
				typeof plugin.configResolved === "function"
			) {
				plugin.configResolved({ root: "/test/project" } as any);
			}

			const mockServer = {
				hot: {
					send: vi.fn(),
				},
			};

			// Test non-stylesheet files
			const nonStylesheetFiles = [
				"main.ts",
				"component.tsx",
				"utils.js",
				"config.json",
				"README.md",
			];

			for (const fileName of nonStylesheetFiles) {
				vi.clearAllMocks();

				if (
					plugin &&
					typeof plugin === "object" &&
					"handleHotUpdate" in plugin &&
					typeof plugin.handleHotUpdate === "function"
				) {
					await plugin.handleHotUpdate({
						server: mockServer,
						file: `/test/project/src/${fileName}`,
						timestamp: Date.now(),
					} as any);
				}

				expect(mockServer.hot.send).toHaveBeenCalledWith({ type: "full-reload" });
			}
		});
	});
});
