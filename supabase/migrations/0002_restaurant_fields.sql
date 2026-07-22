-- ============================================================
-- posts テーブルに「接待レストラン」用の列を追加
-- ------------------------------------------------------------
-- 使い方: このファイルの内容をすべてコピーし、Supabase ダッシュボード
--         → SQL Editor に貼り付けて Run（実行）してください。
-- 前提: 0001_posts.sql を実行済みであること
-- ============================================================

-- 味の感想（コメント）
alter table public.posts
  add column if not exists taste text;

-- 価格帯（'1000-5000' / '5001-10000' / '10000+' のいずれか）
alter table public.posts
  add column if not exists price_range text;

-- 評価（★1〜5）
alter table public.posts
  add column if not exists rating smallint;

-- 価格帯の値を制限する CHECK 制約
alter table public.posts
  drop constraint if exists posts_price_range_check;
alter table public.posts
  add constraint posts_price_range_check
  check (price_range in ('1000-5000', '5001-10000', '10000+'));

-- 評価は 1〜5 に制限する CHECK 制約
alter table public.posts
  drop constraint if exists posts_rating_check;
alter table public.posts
  add constraint posts_rating_check
  check (rating between 1 and 5);
