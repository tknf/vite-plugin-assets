/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly BUILD_ID: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
