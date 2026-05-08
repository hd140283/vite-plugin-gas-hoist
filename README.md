# vite-plugin-gas-hoist

[![npm version](https://img.shields.io/npm/v/vite-plugin-gas-hoist)](https://www.npmjs.com/package/vite-plugin-gas-hoist)
[![Vite compatibility](https://registry.vite.dev/api/badges?package=vite-plugin-gas-hoist&tool=vite)](https://registry.vite.dev)

[日本語](README.ja.md)

A Vite plugin that hoists entry point `export`s to the global scope for Google Apps Script (GAS), preserving the original ESM declaration kind (`function` / `const` / `let` / `var`).

## Try it

Edit and build in your browser — no setup required. Once the build finishes, open `dist/app.js` to see the hoisted output.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/hd140283/vite-plugin-gas-hoist/tree/main/example?file=src/app.js)

## Why?

When you bundle code for GAS with Vite, you typically use the `iife` format to combine multiple modules into a single file. Naming the IIFE variable with a trailing underscore (e.g. `lib_` via `build.lib.name`) takes advantage of GAS's library visibility rules to hide the entire bundle from library consumers.

The catch: that also hides everything you actually want to expose — both functions called by library consumers and functions you want to run from the GAS editor's "Run" dropdown or triggers. This plugin re-declares each entry-point `export` outside the IIFE, so only what you explicitly export becomes globally visible.

```js
// Before build (entry point)
export const sayHello = (name) => `Hello, ${name}!`;

// After build
var lib_ = (function(){ /* IIFE bundle containing sayHello */ })({});
const sayHello = (...args) => lib_.sayHello(...args); // added by the plugin
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

Exports are hoisted to the global scope via the variable name specified in `build.lib.name` (e.g. `lib_`).

## What gets hoisted

Exposing something globally in GAS serves one of two purposes:

- **External**: callable by library consumers as `MyLib.foo()`
- **Internal**: visible inside the same project — selectable in the editor's "Run" dropdown and trigger settings

By preserving the original ESM declaration kind (`function` / `const` / `let` / `var`) and the right-hand-side shape, the plugin lets you express both axes naturally. GAS's library visibility rules apply directly: `function` and `var` are externally visible, `const` and `let` are not.

| ESM declaration | Output | GAS library visibility |
|---|---|---|
| `export function foo() {}` | `function foo(...args){return lib_.foo(...args)}` | external |
| `export const FOO = 42` | `const FOO = lib_.FOO` | internal only |
| `export const foo = (x) => x` | `const foo = (...args) => lib_.foo(...args)` | internal only (appears in the editor's "Run" dropdown) |
| `export const foo = function(x){...}` | `const foo = function(...args){return lib_.foo(...args)}` | internal only (same) |
| `export let foo = ...` | `let foo = ...` (right-hand side as above) | internal only |
| `export var foo = ...` | `var foo = ...` (right-hand side as above) | external |

Specifier-form re-exports like `export { foo }` and `export { foo as bar }` inherit the kind of the local declaration. Patterns not covered above (`export default`, `export class`, re-exports whose kind cannot be determined, etc.) are skipped with a build-time warning.

> Function and arrow-function right-hand sides are kept as wrapper forms so the binding shows up in the GAS editor's "Run" dropdown (enabling trigger setup and manual invocation). Plain values are hoisted as direct references — they aren't called as functions, so they don't need to appear in the editor.

## Requirements

- `build.lib.formats` must include `'iife'`
- Entry point must have at least one `export`

## Migration from 0.1.x

In 0.1.x, every export was hoisted as `function name(...){...}`. From 0.2.0 onward, the plugin preserves the original ESM declaration kind:

- `export function foo()`: unchanged (still `function foo(...){...}`)
- `export const foo = (x) => x`: now `const foo = (...args) => lib_.foo(...args)` (was `function foo(...){...}` in 0.1.x)
- `export const FOO = 42`: now `const FOO = lib_.FOO` (was `function FOO(...){...}` in 0.1.x)

If you've been choosing declaration kinds intentionally to align with GAS's library visibility rules (`function` / `var` for external, `const` / `let` for internal), that intent is now reflected in the build output.

## License

[MIT](LICENSE)
