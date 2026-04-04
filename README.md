# vite-plugin-gas-hoist

[日本語](README.ja.md)

A Vite plugin that hoists entry point `export`s to the global scope for Google Apps Script (GAS).

## Why?

GAS can only execute functions in the global scope, but Vite bundles all code inside an IIFE. This plugin automatically wraps entry point exports as global functions, bridging the gap.

```js
// Before build (entry point)
export const sayHello = (name) => `Hello, ${name}!`;

// After build (plugin adds this)
function sayHello(...args) { return lib_.sayHello(...args) }
```

## Install

```bash
npm install -D vite-plugin-gas-hoist
```

## Usage

```js
// vite.config.js
import { defineConfig } from 'vite';
import { vitePluginGasHoist } from 'vite-plugin-gas-hoist';

export default defineConfig({
  plugins: [vitePluginGasHoist()],
  build: {
    lib: {
      entry: 'src/main.js',
      formats: ['iife'],
      name: 'lib_',
      fileName: (_, entryName) => `${entryName}.js`,
    },
  },
});
```

Exported functions are hoisted to the global scope via the variable name specified in `build.lib.name` (e.g. `lib_`).

## Requirements

- `build.lib.formats` must include `'iife'`
- Entry point must have at least one `export`

## License

[MIT](LICENSE)
