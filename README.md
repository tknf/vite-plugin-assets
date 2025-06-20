<div align="center">

# 🚀 Vite Plugin Assets

**Seamless asset management for TypeScript backends with Vite frontends**

[![Github Workflow Status](https://img.shields.io/github/actions/workflow/status/tknf/vite-plugin-assets/ci.yaml?branch=main)](https://github.com/tknf/vite-plugin-assets/actions)
[![Github](https://img.shields.io/github/license/tknf/vite-plugin-assets)](https://github.com/tknf/vite-plugin-assets/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/@tknf/vite-plugin-assets.svg)](https://www.npmjs.com/package/@tknf/vite-plugin-assets)
[![npm bundle size](https://img.shields.io/bundlephobia/min/@tknf/vite-plugin-assets)](https://bundlephobia.com/package/@tknf/vite-plugin-assets)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@tknf/vite-plugin-assets)](https://bundlephobia.com/package/@tknf/vite-plugin-assets)
[![Github commit activity](https://img.shields.io/github/commit-activity/m/tknf/vite-plugin-assets)](https://github.com/tknf/vite-plugin-assets/pulse)
[![GitHub last commit](https://img.shields.io/github/last-commit/tknf/vite-plugin-assets)](https://github.com/tknf/vite-plugin-assets/commits/main)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/tknf/vite-plugin-assets)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue.svg)](https://www.typescriptjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF.svg)](https://vitejs.dev/)

</div>

## ✨ Features

- **🔄 Environment-Aware Asset Resolution** - Automatically switches between development and production asset paths
- **🆔 Build ID Generation** - Unique identifiers for each build to enable efficient cache invalidation
- **⚡ Hot Reload Enhancement** - Intelligent hot module replacement for CSS and TypeScript files
- **📦 Asset Pipeline Integration** - Automatic discovery and configuration of asset entry points
- **🎯 TypeScript-First** - Full type safety and excellent developer experience
- **🚀 Zero Configuration** - Sensible defaults with optional customization

## 📦 Installation

```bash
npm install @tknf/vite-plugin-assets
# or
pnpm add @tknf/vite-plugin-assets
# or
yarn add @tknf/vite-plugin-assets
```

## 🚀 Quick Start

### 1. Configure Vite Plugin

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import assetsPlugin from '@tknf/vite-plugin-assets/plugin'

export default defineConfig({
  plugins: [
    assetsPlugin({
      // Optional configuration
      buildId: { enabled: true },
      pipeline: { 
        entry: 'src/assets/**/*.{js,ts,css,scss}',
        enabled: true 
      },
      hotReload: { 
        entry: ['src/**/*.ts', 'src/**/*.tsx'],
        enabled: true 
      }
    })
  ]
})
```

### 2. Use in Your Backend

```typescript
// app.ts
import { asset } from '@tknf/vite-plugin-assets'

// Resolve asset paths automatically
const scriptPath = asset('src/main.ts')
const stylePath = asset('src/style.css')

// In development: returns original paths for Vite dev server
// In production: returns hashed paths from manifest.json

console.log(scriptPath) 
// Dev:  'src/main.ts'
// Prod: 'assets/main-abc123.js'
```

### 3. Server-Side Rendering Example

```tsx
// Hono example
import { Hono } from 'hono'
import { asset } from '@tknf/vite-plugin-assets'

const app = new Hono()

app.get('/', (c) => {
  return c.html(
    <html lang="en">
      <head>
        {import.meta.env.DEV && (
          <script type="module" src="@vite/client"></script>
        )}
        <link rel="stylesheet" href={asset('src/style.css')} />
        <script src={`/main.js?build=${import.meta.env.BUILD_ID}`} type="module"></script>
      </head>
      <body>
        <div id="app"></div>
        <script type="module" src={asset('src/main.ts')}></script>
      </body>
    </html>
  )
})
```

## 🔧 Configuration Options

### Plugin Options

```typescript
interface VitePluginAssetsOptions {
  // Build ID generation
  buildId?: {
    enabled?: boolean  // Default: true
  }
  
  // Asset pipeline configuration
  pipeline?: {
    entry?: string | string[]     // Default: 'src/assets/**/*.{js,ts,css,scss,sass,less,styl}'
    outDir?: string              // Default: 'dist'
    assetsDir?: string           // Default: 'assets'
    enabled?: boolean            // Default: true
  }
  
  // Hot reload settings
  hotReload?: {
    entry?: string | string[]    // Default: ['src/**/*.ts', 'src/**/*.tsx']
    ignore?: string | string[]   // Files to ignore
    enabled?: boolean            // Default: true
  }
}
```

### Asset Resolution API

```typescript
// Resolve asset with optional base URL
asset(path: string, baseUrl?: string): string

// Examples
asset('src/main.ts')                    // Basic usage
asset('src/style.css', '/static/')     // Custom base URL
```

## 🌟 Why Vite Plugin Assets?

### The Problem
Modern web development with Vite and TypeScript backends faces several challenges:

- **Path Resolution Complexity**: Different asset paths in development vs production
- **Cache Management**: Manual cache invalidation across deployments  
- **Hot Reload Limitations**: Suboptimal HMR for certain file types
- **Configuration Overhead**: Complex setup for asset discovery and bundling

### The Solution
This plugin provides a unified solution that:

- ✅ **Automatically handles environment differences**
- ✅ **Generates unique build IDs for cache busting**
- ✅ **Enhances hot reload with intelligent file watching**
- ✅ **Discovers and configures assets with zero setup**

## 🔍 Examples

Check out the [examples directory](./examples) for complete implementation examples:

- **Cloudflare Workers**: Full-stack TypeScript with asset management

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/tknf/vite-plugin-assets.git
cd vite-plugin-assets

# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Build the project
pnpm build

# Type checking
pnpm typecheck

# Linting and formatting
pnpm check
pnpm format
```

## 📋 Requirements

- **Node.js**: LTS version or higher
- **TypeScript**: 5.8+
- **Vite**: 6.0+

## 📄 License

MIT License - see the [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Ensure tests pass: `pnpm run test`
5. Ensure linting passes: `pnpm run lint`
6. Submit a pull request

