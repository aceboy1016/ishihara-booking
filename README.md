# 石原トレーナー予約システム

石原トレーナーのパーソナルトレーニング予約早見表システムです。

## 機能

- **リアルタイム予約状況**: Google Calendar APIで最新の予約状況を取得
- **店舗別表示**: 恵比寿店・半蔵門店の予約状況を切り替え表示
- **複数選択予約リクエスト**: 候補日時を複数選択してLINEで送信
- **管理者機能**: 詳細な予約状況と手動データ更新
- **2ヶ月制限**: 予約規約に準拠した期間制限
- **レスポンシブデザイン**: PC・スマートフォン対応

## 技術スタック

- **Framework**: Next.js 15.5.2
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API**: Google Calendar API
- **Deployment**: Vercel

## 本番環境デプロイ手順

### 1. Google Calendar API設定

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクト作成
2. Calendar APIを有効化
3. サービスアカウント作成とキー生成
4. 対象カレンダーにサービスアカウントの閲覧権限を付与

### 2. 環境変数設定

`.env.local`ファイルを作成:

```bash
GOOGLE_CREDENTIALS_JSON={"type":"service_account",...}
LOGIN_PASSWORD=your-secure-password
ADMIN_PASSWORD=your-admin-password
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-key
```

### 3. Vercelデプロイ

```bash
# Vercel CLIインストール
npm i -g vercel

# デプロイ
vercel

# 環境変数設定
vercel env add GOOGLE_CREDENTIALS_JSON
vercel env add LOGIN_PASSWORD
vercel env add ADMIN_PASSWORD
```

## ローカル開発

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

## セキュリティ考慮事項

- 認証情報は環境変数で管理
- Google Calendar APIキーは適切に制限
- パスワードは強固なものを設定
- HTTPS必須

## 使用方法

### 閲覧者モード
1. パスワードを入力してログイン
2. 店舗を選択（恵比寿・半蔵門）
3. 予約可能な時間帯（○）をクリックして選択
4. LINEメッセージをコピーして送信

### 管理者モード
1. 「管理者モード」をクリック
2. 管理者パスワードを入力
3. 詳細な予約状況と色分け表示
4. 手動データ更新機能利用可能

## サポート

システムに関する問い合わせは、管理者まで連絡してください。
