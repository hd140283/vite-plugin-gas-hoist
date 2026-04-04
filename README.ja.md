# vite-plugin-gas-hoist

[English](README.md)

エントリーポイントの `export` を Google Apps Script (GAS) のグローバルスコープに公開する Vite プラグイン。

## なぜ必要？

GAS はグローバルスコープの関数しか実行できないが、Vite でバンドルすると全てのコードが IIFE 内に閉じ込められる。このプラグインは、エントリーポイントの `export` を自動的にグローバル関数としてラップすることで、この問題を解決する。

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

`build.lib.name` に指定した変数名（上記例では `lib_`）を介して、エクスポートされた関数がグローバルスコープに公開される。

## 動作条件

- `build.lib.formats` に `'iife'` を含むこと
- エントリーポイントで関数を `export` していること

## ライセンス

[MIT](LICENSE)
