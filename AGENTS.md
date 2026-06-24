# AGENTS.md — vibe-sns-template

## このプロジェクトは何か
Vibe Coding Bootcamp 受講者用のテンプレート。カメラ連携 SNS を AI に指示して構築する。
受講者は非エンジニア（営業・企画・マーケなど）。コードの説明は日本語でシンプルに。

## 技術スタック
- Next.js 14（App Router）
- React 18
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase（@supabase/ssr + @supabase/supabase-js）
- react-webcam（カメラ連携）

## 今の実装状態
- ✅ Supabase Auth ログイン UI（app/login/page.tsx）
- ✅ react-webcam カメラ起動・プレビュー（components/CameraCapture.tsx）
- ✅ 空のタイムライン UI（「まだ投稿がありません」+ 「撮影へ」ボタン）
- ❌ 写真アップロード（Supabase Storage）
- ❌ posts テーブル・RLS ポリシー
- ❌ タイムライン表示（データ取得）
- ❌ フォロー機能・Realtime

## 絶対に守ること（AI が拡張するとき）
1. コード変更前に必ず GitHub Issue を作成し、Plan モードで計画を提示してから実装する
2. Supabase クライアントは lib/supabase/client.ts（ブラウザ）か lib/supabase/server.ts（サーバー）を使う
3. Route Handler に統一する（Server Actions と混在させない）
4. Supabase Storage のみ使う（ローカルへの画像書き込み禁止）

## 拡張時の参照元
- カメラ: `components/CameraCapture.tsx`
- 認証: `app/login/page.tsx`
- ブラウザ用 Supabase: `lib/supabase/client.ts`
- サーバー用 Supabase: `lib/supabase/server.ts`
- UI コンポーネント: `components/ui/`（shadcn/ui）

## データモデル（今後追加）
- posts: id, user_id, image_url, caption, created_at
- follows: follower_id, following_id, created_at
- profiles: id（= auth.users.id）, display_name, avatar_url

## 禁止事項
- React 19 や Next.js 15 へアップグレードしない（受講者の環境との互換性を維持）
- useState でグローバルな認証状態を管理しない（Supabase Auth のセッションを使う）
- 画像ファイルをローカルストレージに保存しない（Supabase Storage に保存）
