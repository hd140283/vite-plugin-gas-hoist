# vite-plugin-gas-hoist

[![npm version](https://img.shields.io/npm/v/vite-plugin-gas-hoist)](https://www.npmjs.com/package/vite-plugin-gas-hoist)
[![Vite compatibility](https://registry.vite.dev/api/badges?package=vite-plugin-gas-hoist&tool=vite)](https://registry.vite.dev)

[English](README.md)

エントリーポイントの `export` を Google Apps Script (GAS) のグローバルスコープに公開する Vite プラグインです。

## 試してみる

ブラウザ上でコードの編集とビルドを試すことができます。ビルド完了後、`dist/app.js` を開くとプラグインの出力を確認できます。

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/hd140283/vite-plugin-gas-hoist/tree/main/example?file=src/app.js)

## なぜ必要か？

GAS はグローバルスコープの関数しか実行できないが、Vite でバンドルすると全てのコードが IIFE 内に閉じ込められます。このプラグインは、エントリーポイントの `export` を自動的にグローバル関数としてラップすることで、この問題を解決します。

```js
// ビルド前（エントリーポイント）
export const sayHello = (name) => `Hello, ${name}!`;

// ビルド後（プラグインが自動追加）
function sayHello(...args) { return lib_.sayHello(...args) }
```

## インストール

```bash
npm install -D vite-plugin-gas-hoist
```

## 使い方

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

`build.lib.name` に指定した変数名（上記例では `lib_`）を介して、エクスポートされた関数がグローバルスコープに公開されます。

## 動作条件

- `build.lib.formats` に `'iife'` を含むこと
- エントリーポイントで関数を `export` していること

## ライセンス

[MIT](LICENSE)
