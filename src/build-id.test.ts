import { randomBytes } from "node:crypto";
import type { UserConfig } from "vite";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { buildIdPlugin } from "./build-id";

vi.mock("node:crypto", () => ({
	randomBytes: vi.fn(),
}));

describe("buildIdPlugin", () => {
	const mockRandomBytes = vi.mocked(randomBytes);

	beforeEach(() => {
		vi.clearAllMocks();
		mockRandomBytes.mockReturnValue({
			toString: (encoding: string) => {
				if (encoding === "base64url") {
					return "mock-build-id-123";
				}
				return "mock-build-id";
			},
		} as any);
	});

	test("generates build ID by default", () => {
		const plugin = buildIdPlugin();
		expect(plugin).toBeDefined();
		expect(plugin).toHaveProperty("name", "vite-plugin-build-id");
	});

	test("applies only in build mode", () => {
		const plugin = buildIdPlugin();
		expect(plugin).toHaveProperty("apply", "build");
	});

	describe("config", () => {
		test("generates build ID and sets it in define when enabled is true", () => {
			const plugin = buildIdPlugin({ enabled: true });
			const config: UserConfig = {};

			if (
				plugin &&
				typeof plugin === "object" &&
				"config" in plugin &&
				typeof plugin.config === "function"
			) {
				plugin.config(config, { command: "build", mode: "production" });
			}

			expect(mockRandomBytes).toHaveBeenCalledWith(16);
			expect(config.define).toEqual({
				"import.meta.env.BUILD_ID": JSON.stringify("mock-build-id-123"),
			});
		});

		test("does not generate build ID when enabled is false", () => {
			const plugin = buildIdPlugin({ enabled: false });
			const config: UserConfig = {};

			if (
				plugin &&
				typeof plugin === "object" &&
				"config" in plugin &&
				typeof plugin.config === "function"
			) {
				plugin.config(config, { command: "build", mode: "production" });
			}

			expect(mockRandomBytes).not.toHaveBeenCalled();
			expect(config.define).toBeUndefined();
		});

		test("merges with existing define configuration", () => {
			const plugin = buildIdPlugin({ enabled: true });
			const config: UserConfig = {
				define: {
					"process.env.TEST": JSON.stringify("test"),
				},
			};

			if (
				plugin &&
				typeof plugin === "object" &&
				"config" in plugin &&
				typeof plugin.config === "function"
			) {
				plugin.config(config, { command: "build", mode: "production" });
			}

			expect(config.define).toEqual({
				"process.env.TEST": JSON.stringify("test"),
				"import.meta.env.BUILD_ID": JSON.stringify("mock-build-id-123"),
			});
		});
	});

	describe("buildStart", () => {
		test("logs build ID to console when generated", () => {
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
			const plugin = buildIdPlugin({ enabled: true });
			const config: UserConfig = {};

			if (
				plugin &&
				typeof plugin === "object" &&
				"config" in plugin &&
				typeof plugin.config === "function"
			) {
				plugin.config(config, { command: "build", mode: "production" });
			}
			if (
				plugin &&
				typeof plugin === "object" &&
				"buildStart" in plugin &&
				typeof plugin.buildStart === "function"
			) {
				plugin.buildStart.call({} as any, {} as any);
			}

			expect(consoleSpy).toHaveBeenCalledWith("Build ID: mock-build-id-123");
			consoleSpy.mockRestore();
		});

		test("does not log anything when build ID is not generated", () => {
			const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
			const plugin = buildIdPlugin({ enabled: false });
			const config: UserConfig = {};

			if (
				plugin &&
				typeof plugin === "object" &&
				"config" in plugin &&
				typeof plugin.config === "function"
			) {
				plugin.config(config, { command: "build", mode: "production" });
			}
			if (
				plugin &&
				typeof plugin === "object" &&
				"buildStart" in plugin &&
				typeof plugin.buildStart === "function"
			) {
				plugin.buildStart.call({} as any, {} as any);
			}

			expect(consoleSpy).not.toHaveBeenCalled();
			consoleSpy.mockRestore();
		});
	});
});

describe("generateBuildId", () => {
	const mockRandomBytes = vi.mocked(randomBytes);

	test("returns 16-byte random value encoded in Base64URL", () => {
		const plugin = buildIdPlugin({ enabled: true });
		const config: UserConfig = {};

		if (
			plugin &&
			typeof plugin === "object" &&
			"config" in plugin &&
			typeof plugin.config === "function"
		) {
			plugin.config(config, { command: "build", mode: "production" });
		}

		expect(mockRandomBytes).toHaveBeenCalledWith(16);
		expect(config.define?.["import.meta.env.BUILD_ID"]).toBe(JSON.stringify("mock-build-id-123"));
	});
});
