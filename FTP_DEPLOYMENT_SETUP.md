# FTP Deployment Setup

このプロジェクトでは、GitHub ActionsでビルドしたNext.jsアプリケーションをFTPでサーバーにデプロイできます。

## 利用可能なワークフロー

### 1. deploy.yml - 標準デプロイメント
- Next.jsアプリケーションを標準ビルド（`.next/`フォルダ）
- Node.jsが動作するサーバー向け

### 2. deploy-static.yml - 静的サイトデプロイメント  
- 静的サイト生成（`out/`フォルダ）
- 通常のWebホスティングサービス向け（推奨）

## セットアップ手順

### 1. GitHub Secretsの設定

リポジトリの Settings > Secrets and variables > Actions で以下のシークレットを追加してください：

- `FTP_SERVER`: FTPサーバーのホスト名（例: `ftp.example.com`）
- `FTP_USERNAME`: FTPユーザー名
- `FTP_PASSWORD`: FTPパスワード

### 2. ワークフローの選択

#### 静的サイトホスティング（推奨）
- 通常のWebホスティングサービスを使用する場合
- `deploy-static.yml`を使用
- 手動実行：Actions タブから "Build Static and Deploy via FTP" を実行

#### Node.jsサーバー
- Node.jsが動作するサーバーの場合  
- `deploy.yml`を使用

### 3. デプロイ設定のカスタマイズ

必要に応じて以下を変更してください：

#### サーバーディレクトリの変更
```yaml
server-dir: "/public_html/"  # アップロード先ディレクトリ
```

#### 除外ファイルの追加
```yaml
exclude: |
  **/.git*
  **/.git*/**
  **/node_modules/**
  **/.env*
  **/README.md
  **/custom-file-to-exclude
```

## 使用方法

1. `main`または`master`ブランチにプッシュすると自動デプロイ
2. 手動実行：GitHub ActionsのWorkflowsタブから実行可能

## トラブルシューティング

### よくある問題

1. **FTP接続エラー**
   - Secretsが正しく設定されているか確認
   - サーバーのFTP設定を確認

2. **ビルドエラー**
   - 依存関係の問題：`package-lock.json`を確認
   - TypeScriptエラー：lintを通るか確認

3. **静的サイトでの画像表示問題**
   - `next.config.js`で`images.unoptimized: true`が設定されているか確認

### サポート

問題が発生した場合は、GitHub ActionsのLogを確認してください。