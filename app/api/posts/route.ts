import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// 投稿作成 Route Handler
// 撮影した写真・動画を Supabase Storage (post-images) にアップロードし、
// posts テーブルに投稿レコードを作成する
// POST /api/posts  (multipart/form-data: media, caption, taste, price_range, rating)
//
// 認証はサーバー側の Cookie セッションで確認し（ログイン中の本人のみ投稿可）、
// 保存処理は service_role（管理キー）で行う。
// これにより Storage / posts の RLS 設定に左右されず確実に保存できる。

// アップロード可能な最大サイズ（動画を考慮して 50MB）
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

// MIME タイプ → 保存時の拡張子
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/webm': 'webm',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
};

export async function POST(request: Request) {
  // ① ログイン確認（Cookie のセッションから本人を特定）
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
  }

  // ② フォームデータからメディア（写真/動画）と各項目を取り出す
  const formData = await request.formData();
  // 新しいフィールド名は media。旧クライアント互換のため image もフォールバック
  const media = (formData.get('media') ?? formData.get('image')) as unknown;
  const caption = (formData.get('caption') as string | null)?.trim() || null;
  const taste = (formData.get('taste') as string | null)?.trim() || null;
  const priceRange = (formData.get('price_range') as string | null)?.trim() || null;
  const ratingRaw = formData.get('rating') as string | null;
  const rating = ratingRaw ? Number(ratingRaw) : null;

  if (!(media instanceof Blob) || media.size === 0) {
    return NextResponse.json({ error: '写真または動画がありません' }, { status: 400 });
  }

  // メディアの種別を判定（image / video）
  const mimeType = media.type || 'application/octet-stream';
  const isVideo = mimeType.startsWith('video/');
  const isImage = mimeType.startsWith('image/');
  if (!isImage && !isVideo) {
    return NextResponse.json(
      { error: '写真または動画のファイルを選んでください' },
      { status: 400 }
    );
  }

  if (media.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: 'ファイルサイズが大きすぎます（最大50MBまで）' },
      { status: 400 }
    );
  }

  // 全項目必須のバリデーション
  if (!caption) {
    return NextResponse.json({ error: '店名・料理名を入力してください' }, { status: 400 });
  }
  if (!taste) {
    return NextResponse.json({ error: '味の感想を入力してください' }, { status: 400 });
  }

  const ALLOWED_PRICE_RANGES = ['1000-5000', '5001-10000', '10000+'];
  if (!priceRange || !ALLOWED_PRICE_RANGES.includes(priceRange)) {
    return NextResponse.json({ error: '価格帯を選択してください' }, { status: 400 });
  }

  if (rating === null || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: '評価（★1〜5）を選択してください' }, { status: 400 });
  }

  // ③ 保存処理は管理クライアント（service_role）で行う
  const admin = createAdminClient();

  // 保存パス: <ユーザーID>/<タイムスタンプ>.<拡張子>
  const ext = EXT_BY_MIME[mimeType] ?? (isVideo ? 'mp4' : 'jpg');
  const path = `${user.id}/${Date.now()}.${ext}`;

  // Storage へアップロード
  const { error: uploadError } = await admin.storage
    .from('post-images')
    .upload(path, media, { contentType: mimeType, upsert: false });

  if (uploadError) {
    console.error('[POST /api/posts] upload error:', uploadError);
    return NextResponse.json(
      { error: `アップロードに失敗しました: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // 味・価格帯・評価は既存の caption 列に JSON でまとめて保存する。
  // （DB に列を追加しなくても動くようにするための方式。
  //   将来 taste / price_range / rating 列を追加したらそちらへ移行してよい）
  const captionPayload = JSON.stringify({
    v: 1,
    name: caption,
    taste,
    price: priceRange,
    rating,
    media: isVideo ? 'video' : 'image',
  });

  // posts テーブルに保存（image_url にはバケット内の保存パスを入れる）
  const { error: insertError } = await admin.from('posts').insert({
    user_id: user.id,
    image_url: path,
    caption: captionPayload,
  });

  if (insertError) {
    console.error('[POST /api/posts] insert error:', insertError);
    // DB 保存に失敗した場合はアップロード済みの画像を削除して整合性を保つ
    await admin.storage.from('post-images').remove([path]);
    return NextResponse.json(
      { error: `投稿の保存に失敗しました: ${insertError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
