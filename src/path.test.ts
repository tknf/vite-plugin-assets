import { describe, expect, test, vi } from "vitest";
import { normalizeGlobPattern } from "./path";

vi.mock("vite", () => ({
	normalizePath: vi.fn((path: string) => path.replace(/\\/g, "/")),
}));

describe("normalizeGlobPattern", () => {
	const root = "/project/root";

	test("converts absolute path to relative path from project root", () => {
		const pattern = "/project/root/src/components/**/*.ts";
		const result = normalizeGlobPattern(pattern, root);
		expect(result).toBe("src/components/**/*.ts");
	});

	test("removes leading slash for absolute paths outside project root", () => {
		const pattern = "/other/path/src/**/*.ts";
		const result = normalizeGlobPattern(pattern, root);
		expect(result).toBe("other/path/src/**/*.ts");
	});

	test("removes leading slash from paths", () => {
		const pattern = "/src/components/**/*.ts";
		const result = normalizeGlobPattern(pattern, root);
		expect(result).toBe("src/components/**/*.ts");
	});

	test("removes ./ prefix from paths", () => {
		const pattern = "./src/components/**/*.ts";
		const result = normalizeGlobPattern(pattern, root);
		expect(result).toBe("src/components/**/*.ts");
	});

	test("returns already normalized paths as-is", () => {
		const pattern = "src/components/**/*.ts";
		const result = normalizeGlobPattern(pattern, root);
		expect(result).toBe("src/components/**/*.ts");
	});

	test("returns empty string as-is", () => {
		const pattern = "";
		const result = normalizeGlobPattern(pattern, root);
		expect(result).toBe("");
	});

	test("returns single dot as-is", () => {
		const pattern = ".";
		const result = normalizeGlobPattern(pattern, root);
		expect(result).toBe(".");
	});

	test("preserves ../ in relative paths", () => {
		const pattern = "../sibling/src/**/*.ts";
		const result = normalizeGlobPattern(pattern, root);
		expect(result).toBe("../sibling/src/**/*.ts");
	});

	test("normalizes Windows-style paths", () => {
		const pattern = "src\\components\\**\\*.ts";
		const result = normalizeGlobPattern(pattern, root);
		expect(result).toBe("src/components/**/*.ts");
	});

	test("preserves complex glob patterns", () => {
		const pattern = "src/**/?(*.ts|*.tsx)";
		const result = normalizeGlobPattern(pattern, root);
		expect(result).toBe("src/**/?(*.ts|*.tsx)");
	});

	test("handles nested relative paths", () => {
		const pattern = "./src/./components/../utils/**/*.ts";
		const result = normalizeGlobPattern(pattern, root);
		expect(result).toBe("src/./components/../utils/**/*.ts");
	});

	test("handles deep paths within project root", () => {
		const pattern = "/project/root/src/deep/nested/path/**/*.{js,ts}";
		const result = normalizeGlobPattern(pattern, root);
		expect(result).toBe("src/deep/nested/path/**/*.{js,ts}");
	});

	test("preserves trailing slashes", () => {
		const pattern = "./src/components/";
		const result = normalizeGlobPattern(pattern, root);
		expect(result).toBe("src/components/");
	});

	test("handles patterns with special characters", () => {
		const pattern = "./src/@components/[id]/**/*.ts";
		const result = normalizeGlobPattern(pattern, root);
		expect(result).toBe("src/@components/[id]/**/*.ts");
	});
});

describe("normalizeRelativePath edge cases", () => {
	test("handles paths starting with slash", () => {
		// normalizeRelativePath is internal function, test via normalizeGlobPattern
		const result1 = normalizeGlobPattern("/absolute/path", "/project");
		expect(result1).toBe("absolute/path");

		const result2 = normalizeGlobPattern("/", "/project");
		expect(result2).toBe("");
	});
});
