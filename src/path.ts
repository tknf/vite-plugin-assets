import path from "node:path";
import { normalizePath } from "vite";

// Normalize glob patterns to be relative to the project root for consistent matching
export const normalizeGlobPattern = (pattern: string, root: string): string => {
	const normalized = normalizePath(pattern);

	// Handle absolute paths by converting to relative paths
	if (path.isAbsolute(normalized)) {
		const relative = path.relative(root, normalized);
		// Use relative path if it's within the project (doesn't start with ..)
		if (!relative.startsWith("..") && !path.isAbsolute(relative)) {
			return normalizePath(relative);
		}
		// Remove leading slash for absolute paths outside project root
		return normalized.slice(1);
	}

	// Remove leading slash from root-relative paths
	if (normalized.startsWith("/")) {
		return normalized.slice(1);
	}

	// Remove leading "./" from current directory relative paths
	if (normalized.startsWith("./")) {
		return normalized.slice(2);
	}

	// Return as-is for simple relative paths
	return normalized;
};
