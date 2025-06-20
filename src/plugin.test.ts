import { beforeEach, describe, expect, test, vi } from "vitest";
import assetsPlugin, { type VitePluginAssetsOptions } from "./plugin";

vi.mock("./build-id", () => ({
	buildIdPlugin: vi.fn((options) => ({
		name: "mock-build-id-plugin",
		options,
	})),
}));

vi.mock("./hot-reload", () => ({
	hotReloadPlugin: vi.fn((options) => ({
		name: "mock-hot-reload-plugin",
		options,
	})),
}));

vi.mock("./pipeline", () => ({
	assetsPipelinePlugin: vi.fn((options) => ({
		name: "mock-assets-pipeline-plugin",
		options,
	})),
}));

describe("assetsPlugin", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	test("returns all plugins with default options", () => {
		const plugins = assetsPlugin();

		expect(Array.isArray(plugins)).toBe(true);
		expect(plugins).toHaveLength(3);
		expect((plugins as any[])[0]).toHaveProperty("name", "mock-build-id-plugin");
		expect((plugins as any[])[1]).toHaveProperty("name", "mock-assets-pipeline-plugin");
		expect((plugins as any[])[2]).toHaveProperty("name", "mock-hot-reload-plugin");
	});

	test("uses default values when no options provided", () => {
		const plugins = assetsPlugin() as any[];

		expect(plugins[0].options).toEqual({ enabled: true });
		expect(plugins[1].options).toEqual({
			entry: "src/assets/**/*.{js,ts,css,scss,sass,less,styl}",
			outDir: "dist",
			assetsDir: "assets",
		});
		expect(plugins[2].options).toEqual({
			entry: ["src/**/*.ts", "src/**/*.tsx", "src/assets/**/*.{js,ts,css,scss,sass,less,styl}"],
			ignore: [],
		});
	});

	test("disables buildId plugin when enabled is false", () => {
		const options: VitePluginAssetsOptions = {
			buildId: { enabled: false },
		};
		const plugins = assetsPlugin(options);

		expect(plugins).toHaveLength(2);
		expect((plugins as any[])[0]).toHaveProperty("name", "mock-assets-pipeline-plugin");
		expect((plugins as any[])[1]).toHaveProperty("name", "mock-hot-reload-plugin");
	});

	test("disables pipeline plugin when enabled is false", () => {
		const options: VitePluginAssetsOptions = {
			pipeline: { enabled: false },
		};
		const plugins = assetsPlugin(options);

		expect(plugins).toHaveLength(2);
		expect((plugins as any[])[0]).toHaveProperty("name", "mock-build-id-plugin");
		expect((plugins as any[])[1]).toHaveProperty("name", "mock-hot-reload-plugin");
	});

	test("disables hotReload plugin when enabled is false", () => {
		const options: VitePluginAssetsOptions = {
			hotReload: { enabled: false },
		};
		const plugins = assetsPlugin(options);

		expect(plugins).toHaveLength(2);
		expect((plugins as any[])[0]).toHaveProperty("name", "mock-build-id-plugin");
		expect((plugins as any[])[1]).toHaveProperty("name", "mock-assets-pipeline-plugin");
	});

	test("disables all plugins when all are disabled", () => {
		const options: VitePluginAssetsOptions = {
			buildId: { enabled: false },
			pipeline: { enabled: false },
			hotReload: { enabled: false },
		};
		const plugins = assetsPlugin(options);

		expect(plugins).toHaveLength(0);
	});

	test("uses custom pipeline options", () => {
		const options: VitePluginAssetsOptions = {
			pipeline: {
				entry: "custom/assets/**/*.js",
				outDir: "build",
				assetsDir: "static",
			},
		};
		const plugins = assetsPlugin(options) as any[];

		expect(plugins[1].options).toEqual({
			entry: "custom/assets/**/*.js",
			outDir: "build",
			assetsDir: "static",
		});
	});

	test("uses custom hotReload options", () => {
		const options: VitePluginAssetsOptions = {
			hotReload: {
				entry: ["custom/**/*.ts"],
				ignore: ["**/test/**"],
			},
		};
		const plugins = assetsPlugin(options) as any[];

		expect(plugins[2].options).toEqual({
			entry: ["custom/**/*.ts", "src/assets/**/*.{js,ts,css,scss,sass,less,styl}"],
			ignore: ["**/test/**"],
		});
	});

	test("merges pipeline entries with hotReload entries", () => {
		const options: VitePluginAssetsOptions = {
			pipeline: {
				entry: "src/styles/**/*.css",
			},
			hotReload: {
				entry: "src/**/*.tsx",
			},
		};
		const plugins = assetsPlugin(options) as any[];

		expect(plugins[2].options.entry).toEqual(["src/**/*.tsx", "src/styles/**/*.css"]);
	});

	test("handles array of pipeline entries", () => {
		const options: VitePluginAssetsOptions = {
			pipeline: {
				entry: ["src/styles/**/*.css", "src/scripts/**/*.js"],
			},
		};
		const plugins = assetsPlugin(options) as any[];

		expect(plugins[2].options.entry).toEqual([
			"src/**/*.ts",
			"src/**/*.tsx",
			"src/styles/**/*.css",
			"src/scripts/**/*.js",
		]);
	});

	test("handles array of hotReload entries", () => {
		const options: VitePluginAssetsOptions = {
			hotReload: {
				entry: ["app/**/*.ts", "lib/**/*.ts"],
			},
		};
		const plugins = assetsPlugin(options) as any[];

		expect(plugins[2].options.entry).toEqual([
			"app/**/*.ts",
			"lib/**/*.ts",
			"src/assets/**/*.{js,ts,css,scss,sass,less,styl}",
		]);
	});

	test("maintains defaults when partial options provided", () => {
		const options: VitePluginAssetsOptions = {
			pipeline: {
				outDir: "custom-dist",
			},
		};
		const plugins = assetsPlugin(options) as any[];

		expect(plugins[1].options).toEqual({
			entry: "src/assets/**/*.{js,ts,css,scss,sass,less,styl}",
			outDir: "custom-dist",
			assetsDir: "assets",
		});
	});

	test("handles empty arrays in options", () => {
		const options: VitePluginAssetsOptions = {
			hotReload: {
				entry: [],
				ignore: [],
			},
		};
		const plugins = assetsPlugin(options) as any[];

		expect(plugins[2].options.entry).toEqual(["src/assets/**/*.{js,ts,css,scss,sass,less,styl}"]);
	});
});
