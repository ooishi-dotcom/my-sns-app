# Vibe SNS — Bootcamp Template

Vibe Coding Bootcamp の SNS テンプレートです。
このテンプレートを出発点として、AI（Claude Code / Cursor）に指示しながらカメラ連携 SNS を構築していきます。

---

## セットアップ手順

### 1. 環境変数ファイルをコピーする

ターミナルで以下のコマンドを実行してください:

```bash
cp .env.example .env.local
```

### 2. Supabase プロジェクトを作成する

https://supabase.com にアクセスし、無料アカウントで新しいプロジェクトを作成してください。

### 3. 環境変数を設定する

Supabase ダッシュボードで **Project Settings > API** を開き、以下の 2 つの値をコピーします:

| 環境変数 | Supabase ダッシュボードでの場所 |
|---------|-------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / public キー |

`.env.local` を開いて、コピーした値を貼り付けてください:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. 依存パッケージをインストールして起動する

```bash
npm install
npm run dev
```

### 5. ブラウザで開く

ターミナルに `ready on http://localhost:3000` と表示されたら、ブラウザで以下の URL を開いてください:

```
http://localhost:3000
```

画面中央に「まだ投稿がありません。カメラで撮影してみましょう。」と表示されれば、セットアップ完了です。

---

## 起動確認チェックリスト

- [ ] ブラウザで http://localhost:3000 を開くと、「まだ投稿がありません」というメッセージが見える
- [ ] 「撮影へ」ボタンをクリックすると http://localhost:3000/capture に遷移する
- [ ] http://localhost:3000/capture を開くとカメラプレビューが表示される（ブラウザがカメラ許可を求めるダイアログが出る）
- [ ] http://localhost:3000/login を開くとメールアドレスとパスワードの入力フォームが見える

---

## うまくいかないときは

### カメラが起動しない

ブラウザがカメラへのアクセス許可を求めるダイアログが出たら「許可」を選択してください。許可したのに起動しない場合は、ブラウザのアドレスバー左のカメラアイコンをクリックして権限を確認してください。

### 「localhost:3000 にアクセスできません」と表示される

ターミナルで `npm run dev` が実行中かどうか確認してください。停止している場合は再度 `npm run dev` を実行してください。

### 画面が真っ白になる場合

F5 キーを押してページを再読み込みしてください。それでも解決しない場合は、ターミナルで **Ctrl+C** を押してサーバーを停止し、`npm run dev` で再起動してください。

---

## テンプレートの構成

```
app/
  page.tsx               # タイムライン画面（ホーム）
  login/page.tsx         # ログイン画面
  capture/page.tsx       # 撮影画面

components/
  CameraCapture.tsx      # カメラ撮影コンポーネント（react-webcam ラッパー）
  ui/                    # shadcn/ui（button, card, input）

lib/
  supabase/
    client.ts            # Supabase ブラウザ接続
    server.ts            # Supabase サーバー接続
```

今の状態で動くもの: カメラプレビュー / ログイン UI（認証フォーム表示）  
受講者が AI に依頼して追加するもの: 写真アップロード・posts テーブル・タイムライン表示・フォロー機能・Realtime
