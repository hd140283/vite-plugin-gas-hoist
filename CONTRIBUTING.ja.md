# 開発ガイドライン

## Git

- コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org) に従う
- コミットは変更の目的ごとに細かく分ける
- ブランチは main の1本で運用する
- 外部からの変更は main 宛ての PR で受け付ける
- リリースは `pnpm version <patch|minor|major> -m "chore: release v%s"` で行い、`git push --follow-tags` でコミットとタグをまとめて push する。タグを push すると npm にステージされるので、npm 上で承認して公開する
- バージョン番号は [Semantic Versioning](https://semver.org) に従う

## コーディング規約

コードスタイルは [Biome](https://biomejs.dev/) で強制される。コミット前に `pnpm run lint` を実行すること。

エントリーポイントとツールの設定ファイルは、それぞれのツールが求める形式に従う。以下の規約はそれ以外のコードに適用する。

- 1ファイル1エクスポートとし、ファイル名はエクスポート名に合わせる
- Class は使わずアロー関数ベースで実装する
- 非同期処理は async/await を使用する
- ファイル名はケバブケースを使用する
- 関数名や変数名はキャメルケースを使用する

## テスト

- ユニットテストは [Vitest](https://vitest.dev) を使用する
- テストは `pnpm run test` で実行する
- テストファイルは `*.test.js` という名前で `test/` ディレクトリに配置する

## ドキュメント

- API ドキュメントは [JSDoc](https://jsdoc.app) を使い、`pnpm run docs` で `docs/` に生成する
- 型・説明は JSDoc で記述し、生成時に警告が出ないことを確認する
- 型は JSDoc の型式で書き、TypeScript 構文は使わない。任意型は `{*}`、キー・バリューは `{Object.<string, function>}`、関数型は `{function(T): R}`
- `const`／`export const` に代入したアロー関数には `@function` を付ける。付けないと引数・戻り値の表が生成されない。名前は変数名から推論されるので省略してよい
- export されないファイル内ローカル関数は公開 API と誤認されないように `@private` を付けてドキュメントから除外する
