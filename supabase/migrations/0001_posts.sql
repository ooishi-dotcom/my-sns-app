-- ============================================================
-- posts テーブル + Storage(post-images) の RLS ポリシー
-- ------------------------------------------------------------
-- 使い方: このファイルの内容をすべてコピーし、Supabase ダッシュボード
--         → SQL Editor に貼り付けて Run（実行）してください。
--         （このリポジトリから DB に直接接続はしません）
-- 前提: Storage に Private の "post-images" バケットを作成済みであること
-- ============================================================

-- 投稿テーブル
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,        -- バケット内の保存パス（例: <uid>/<timestamp>.jpg）を格納
  caption text,
  created_at timestamptz not null default now()
);

-- 新着順の取得を速くするためのインデックス
create index if not exists posts_created_at_idx on public.posts (created_at desc);

-- 行レベルセキュリティを有効化
alter table public.posts enable row level security;

-- 読み取り: ログイン済みユーザーは全員の投稿を閲覧可（共有タイムライン）
drop policy if exists "posts_select_authenticated" on public.posts;
create policy "posts_select_authenticated" on public.posts
  for select to authenticated using (true);

-- 作成: 自分の投稿のみ
drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts
  for insert to authenticated with check (auth.uid() = user_id);

-- 削除: 自分の投稿のみ
drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts
  for delete to authenticated using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Storage: post-images バケットのポリシー
-- ------------------------------------------------------------

-- アップロード: 認証ユーザーが自分の uid フォルダ配下にのみ保存できる
drop policy if exists "post_images_insert_own" on storage.objects;
create policy "post_images_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 読み取り(署名付きURL生成に必要): 認証ユーザーは全画像を読める
drop policy if exists "post_images_select_authenticated" on storage.objects;
create policy "post_images_select_authenticated" on storage.objects
  for select to authenticated
  using (bucket_id = 'post-images');
