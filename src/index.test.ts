import { beforeEach, describe, expect, test, vi } from "vitest";
import { __resetManifestCache, asset, loadManifest } from "./index";

beforeEach(() => {
	vi.clearAllMocks();
	__resetManifestCache();
});

describe("index module", () => {
	test("imports index module to ensure coverage", () => {
		expect(typeof asset).toBe("function");
		expect(typeof loadManifest).toBe("function");
	});

	test("asset function in development mode", () => {
		// Test various input combinations in development mode (PROD is false by default)
		expect(asset("/test.js")).toBe("/test.js");
		expect(asset("styles.css")).toBe("styles.css");
		expect(asset("/src/main.js", "https://cdn.example.com")).toBe("/src/main.js");
		expect(asset("")).toBe("");
		expect(asset("app.js")).toBe("app.js");
		expect(asset("/app.js")).toBe("/app.js");
		expect(asset("components/Button.tsx")).toBe("components/Button.tsx");
		expect(asset("/components/Button.tsx")).toBe("/components/Button.tsx");

		// Test with base URLs (should be ignored in development)
		expect(asset("main.js", "/")).toBe("main.js");
		expect(asset("main.js", "/assets/")).toBe("main.js");
		expect(asset("main.js", "https://cdn.example.com")).toBe("main.js");
	});

	test("asset function in production mode with no manifest", () => {
		// Set production mode
		vi.stubEnv("PROD", true);
		__resetManifestCache();

		// In production with no manifest, should return empty string
		expect(asset("any.js")).toBe("");
		expect(asset("/any.js")).toBe("");
		expect(asset("")).toBe("");

		vi.unstubAllEnvs();
	});

	test("loadManifest function behavior with no manifest", () => {
		// Test with no manifest files
		__resetManifestCache();
		expect(loadManifest()).toBeNull();
	});

	test("asset function basic path handling", () => {
		// Test basic functionality without relying on manifest
		expect(asset("test.js")).toBe("test.js");
		expect(asset("/test.js")).toBe("/test.js");
	});

	test("asset function with empty path", () => {
		// Test edge case with empty path
		expect(asset("")).toBe("");
	});

	test("asset function with baseUrl in development", () => {
		// Test that baseUrl is ignored in development mode
		expect(asset("main.js", "https://cdn.example.com")).toBe("main.js");
		expect(asset("/main.js", "/base/")).toBe("/main.js");
	});

	test("loadManifest caching behavior", () => {
		// Test that manifest is cached
		const first = loadManifest();
		const second = loadManifest();
		expect(first).toBe(second);
	});
});
