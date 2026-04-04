# 開発ガイドライン

## Git

- コミットメッセージは [Conventional Commits](https://www.conventionalcommits.org) に従う
- コミットは変更の目的ごとに細かく分ける

## コーディング規約

### フォーマット

コードスタイルは [Biome](https://biomejs.dev/) で強制される。コミット前に実行すること:

```bash
pnpm run lint
```

### JavaScript

- 1ファイル1エクスポート、ファイル名とエクスポート名は同一にする
- Class は使わずアロー関数ベースで実装
- 非同期処理は async/await を使用
- 型定義は JSDoc で実装
