# vite-plugin-gas-hoist

[![npm version](https://img.shields.io/npm/v/vite-plugin-gas-hoist)](https://www.npmjs.com/package/vite-plugin-gas-hoist)
[![Vite compatibility](https://registry.vite.dev/api/badges?package=vite-plugin-gas-hoist&tool=vite)](https://registry.vite.dev)

[English](README.md)

エントリーポイントの `export` を、ESM の宣言種別（`function` / `const` / `let` / `var`）を保ったまま、Google Apps Script (GAS) のグローバルスコープに公開する Vite プラグインです。

## デモ

ブラウザ上でコードの編集とビルドを試すことができます。ビルド完了後、`dist/app.js` を開くとプラグインの出力を確認できます。

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/hd140283/vite-plugin-gas-hoist/tree/main/example?file=src/app.js)

## 概要

GAS 向けに Vite でバンドルするときは、複数モジュールを 1 ファイルにまとめるために IIFE フォーマットを使います。`build.lib.name` に末尾 `_` 付きの変数名（例: `lib_`）を指定すれば、IIFE 全体が GAS のライブラリ可視性ルールで外部から隠れるので、内部実装をライブラリ利用者に見せずに済みます。

ただ、これだけだとライブラリとして公開したい関数も、エディタの「実行」ボタンから呼び出したい関数も、まとめて隠れてしまいます。このプラグインは、エントリーポイントから `export` したものだけを IIFE の外側に再宣言して、GAS のグローバルスコープに公開します。

```js
// ビルド前（エントリーポイント）
export const sayHello = (name) => `Hello, ${name}!`;

// ビルド後
var lib_ = (function(){ /* バンドルされた sayHello を含む IIFE */ })({});
const sayHello = (...args) => lib_.sayHello(...args); // プラグインが追加
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

`build.lib.name` に指定した変数名（上記例では `lib_`）を介して、エクスポートが GAS のグローバルスコープに公開されます。

## 対応パターン

GAS でグローバルに公開するときの目的は、大きく 2 つに分かれます。

- **外部公開**: ライブラリとして使われたとき、利用者から `MyLib.foo()` で呼び出せる
- **内部公開**: 同じプロジェクト内で、エディタの「実行」ボタンやトリガー設定から呼び出せる

ESM の宣言種別（`function` / `const` / `let` / `var`）と右辺の形をそのまま保つことで、この 2 つの公開を組み合わせて表現できます。GAS のライブラリ可視性ルール（`function` / `var` は外部公開、`const` / `let` は非公開）がそのまま反映される挙動です。

| ESM 宣言 | 出力 | GAS ライブラリ可視性 |
|---|---|---|
| `export function foo() {}` | `function foo(...args){return lib_.foo(...args)}` | 公開 |
| `export const FOO = 42` | `const FOO = lib_.FOO` | 非公開 |
| `export const foo = (x) => x` | `const foo = (...args) => lib_.foo(...args)` | 非公開（エディタの "実行" ドロップダウンに表示） |
| `export const foo = function(x){...}` | `const foo = function(...args){return lib_.foo(...args)}` | 非公開（同上） |
| `export let foo = ...` | `let foo = ...`（右辺は const と同形） | 非公開 |
| `export var foo = ...` | `var foo = ...`（右辺は const と同形） | 公開 |

`export { foo }` や `export { foo as bar }` のような specifier 形式の再エクスポートも、ローカル宣言の種別を引き継ぎます。表に当てはまらないパターン（`export default` や `export class`、宣言種別を判定できない再エクスポートなど）はビルド時に警告を出してスキップします。

> 関数式・アロー関数式の右辺をそのままラップ形式で再宣言するのは、GAS のエディタの "実行" ドロップダウンに表示させる（トリガー設定や手動実行を可能にする）ためです。値の右辺をラップしないのは、関数として呼び出されないためエディタに出す必要がなく、純粋な参照のほうが読みやすいからです。

## 動作条件

- `build.lib.formats` に `'iife'` を含むこと
- エントリーポイントで何かを `export` していること

## 0.1.x からの移行

0.1.x までは全ての export を `function name(...){...}` 形式で hoist していましたが、0.2.0 以降は ESM の宣言種別を保つようになりました。

- `export function foo()`: 挙動は変わらず（`function foo(...){...}` のまま）
- `export const foo = (x) => x`: `const foo = (...args) => lib_.foo(...args)` に変更（0.1.x では `function foo(...){...}`）
- `export const FOO = 42`: `const FOO = lib_.FOO` に変更（0.1.x では `function FOO(...){...}`）

GAS のライブラリ可視性ルールに沿って宣言種別を意図的に選んでいる場合（公開したいものは `function` / `var`、非公開にしたいものは `const` / `let`）、その意図がビルド出力に反映されるようになります。

## ライセンス

[MIT](LICENSE)
