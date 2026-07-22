import Link from 'next/link';
import {
  Camera,
  Star,
  ForkKnife,
  Wine,
  Users,
  Sparkle,
  ArrowRight,
} from '@phosphor-icons/react/dist/ssr';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// キャッシュせず常に最新のタイムラインを取得する
export const dynamic = 'force-dynamic';

type Post = {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
};

// 投稿の詳細（caption 列に JSON でまとめて保存している）
type PostDetails = {
  name: string | null;
  taste: string | null;
  price: string | null;
  rating: number | null;
};

// caption 列をデコードして詳細を取り出す。
// 旧形式（プレーンテキストの caption）は店名として扱う。
function decodePost(caption: string | null): PostDetails {
  if (!caption) return { name: null, taste: null, price: null, rating: null };
  try {
    const o = JSON.parse(caption);
    if (o && typeof o === 'object' && o.v === 1) {
      return {
        name: typeof o.name === 'string' ? o.name : null,
        taste: typeof o.taste === 'string' ? o.taste : null,
        price: typeof o.price === 'string' ? o.price : null,
        rating: typeof o.rating === 'number' ? o.rating : null,
      };
    }
  } catch {
    // JSON でなければ旧形式のプレーンな caption
  }
  return { name: caption, taste: null, price: null, rating: null };
}

// 価格帯コードを表示用ラベルに変換
const PRICE_LABELS: Record<string, string> = {
  '1000-5000': '¥1,000〜5,000',
  '5001-10000': '¥5,001〜10,000',
  '10000+': '¥10,000〜',
};

// ★評価を表示するコンポーネント
function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          weight={n <= rating ? 'fill' : 'regular'}
          className={n <= rating ? 'text-primary-500' : 'text-white/25'}
        />
      ))}
    </div>
  );
}

// 接待シーンのカテゴリー（参考ビジュアルのカードに相当）
const CATEGORIES = [
  { icon: Wine, label: '接待に最適な個室' },
  { icon: ForkKnife, label: '記念日に特別な一皿を' },
  { icon: Users, label: '大切な人と贅沢な時間を' },
];

// トップのヒーローバナー（フクリコ厳選の参考ビジュアルの雰囲気）
function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-primary-500/25">
      {/* 温かいゴールドの光が灯る背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-900/40 via-black/60 to-background" />
      <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-primary-500/20 blur-3xl" />

      <div className="relative px-5 pb-6 pt-8 text-center">
        {/* フクリコ厳選 リボン */}
        <span className="inline-flex items-center gap-1.5 rounded-sm border border-primary-500/50 bg-black/40 px-4 py-1.5 text-xs font-medium tracking-[0.2em] text-primary-300 backdrop-blur">
          <Sparkle size={13} weight="fill" className="text-primary-400" />
          厳選コレクション
        </span>

        {/* 見出し（明朝体） */}
        <h2 className="font-serif-lux mt-4 text-2xl font-bold leading-snug text-foreground sm:text-3xl">
          大人の時間を彩る
          <br />
          <span className="text-primary-300">至福のレストラン</span>特集
        </h2>

        <p className="mx-auto mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-sm">
          接待・記念日・デートにおすすめの名店を厳選。
          <br />
          失敗しない一皿を、あなたの記録から。
        </p>

        {/* Special スクリプト風アクセント */}
        <p className="font-serif-lux mt-2 text-lg italic tracking-wide text-primary-400/90">
          — Special —
        </p>

        {/* カテゴリーカード */}
        <div className="mt-6 grid grid-cols-3 gap-2.5">
          {CATEGORIES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-primary-500/20 bg-gradient-to-b from-primary-900/30 to-black/40 px-2 py-4 text-center transition-colors hover:border-primary-500/50"
            >
              <Icon size={22} className="text-primary-400" />
              <span className="text-[11px] font-medium leading-tight text-foreground/90">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 下部のゴールドアクセントバー */}
      <div className="flex items-center justify-center gap-2 border-t border-primary-500/25 bg-gradient-to-r from-primary-800/40 via-primary-700/30 to-primary-800/40 px-4 py-2.5">
        <span className="text-[11px] font-medium tracking-wide text-primary-200">
          とっておきの一皿を記録して、次の接待を成功へ
        </span>
        <ArrowRight size={13} className="text-primary-300" />
      </div>
    </section>
  );
}

// タイムライン画面（ホーム）
// ログイン済みなら posts テーブルから投稿を取得し、
// Private バケットの画像を署名付きURLで表示する
export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 表示用の投稿（署名付きURL付き）
  let posts: (Post & { signedUrl: string | null })[] = [];

  if (user) {
    // 投稿取得・署名付きURL生成は管理クライアント（service_role）で行い、
    // Storage / posts の RLS 設定に左右されず確実に表示できるようにする
    const admin = createAdminClient();

    const { data } = await admin
      .from('posts')
      .select('id, image_url, caption, created_at')
      .order('created_at', { ascending: false });

    const rows = (data ?? []) as Post[];

    // Private バケットの画像は署名付きURLでのみ表示できる
    let urlByPath = new Map<string, string>();
    if (rows.length > 0) {
      const { data: signed } = await admin.storage
        .from('post-images')
        .createSignedUrls(
          rows.map((p) => p.image_url),
          60 * 60 // 1時間有効
        );
      urlByPath = new Map(
        (signed ?? [])
          .filter((s) => s.signedUrl && s.path)
          .map((s) => [s.path as string, s.signedUrl])
      );
    }

    posts = rows.map((p) => ({ ...p, signedUrl: urlByPath.get(p.image_url) ?? null }));
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 border-b border-primary-500/30 bg-black/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium tracking-[0.3em] text-primary-400/80">
              PREMIUM DINING
            </span>
            <h1 className="font-serif-lux text-lg font-bold tracking-wide text-primary-300">
              失敗しない接待レストラン
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* ログイン中はいつでも撮影へ行けるよう常時表示 */}
            {user && (
              <Link
                href="/capture"
                className="inline-flex items-center gap-1 rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-primary-400"
              >
                <Camera size={16} />
                撮影
              </Link>
            )}
            <Link
              href="/login"
              className="text-sm font-medium text-primary-400 transition-colors hover:text-primary-300"
            >
              {user ? 'アカウント' : 'ログイン'}
            </Link>
          </div>
        </div>
      </header>

      {/* ヒーローバナー */}
      <Hero />

      {/* タイムライン */}
      <main className="px-4 py-6">
        {posts.length === 0 ? (
          // 空状態: 投稿がまだない / 未ログインの場合のUI
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 rounded-full border border-primary-500/40 bg-primary-500/10 p-6">
              <Camera size={48} className="text-primary-500" />
            </div>
            <p className="mb-6 text-muted-foreground">
              {user
                ? 'まだ投稿がありません。とっておきの一皿を撮影しましょう。'
                : 'ログインすると接待レストランの記録を見たり投稿したりできます。'}
            </p>
            <Link
              href={user ? '/capture' : '/login'}
              className="inline-flex items-center gap-2 rounded-md bg-primary-500 px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-primary-400"
            >
              <Camera size={18} />
              {user ? '撮影へ' : 'ログイン'}
            </Link>
          </div>
        ) : (
          // 料理写真のグリッドギャラリー
          <div className="grid grid-cols-2 gap-3">
            {posts.map((post) => {
              const details = decodePost(post.caption);
              return (
                <article
                  key={post.id}
                  className="group overflow-hidden rounded-lg border border-primary-500/20 bg-card shadow-md shadow-black/40 transition-colors hover:border-primary-500/60"
                >
                  <div className="relative aspect-square overflow-hidden">
                    {post.signedUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.signedUrl}
                        alt={details.name ?? '投稿写真'}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-secondary text-xs text-muted-foreground">
                        画像を読み込めませんでした
                      </div>
                    )}
                    {/* 価格帯バッジ */}
                    {details.price && PRICE_LABELS[details.price] && (
                      <span className="absolute right-2 top-2 rounded-full border border-primary-500/50 bg-black/70 px-2 py-0.5 text-[10px] font-medium text-primary-300 backdrop-blur">
                        {PRICE_LABELS[details.price]}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 px-3 py-2.5">
                    {details.name && (
                      <p className="truncate text-sm font-semibold text-foreground">
                        {details.name}
                      </p>
                    )}
                    {details.rating != null && <RatingStars rating={details.rating} />}
                    {details.taste && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{details.taste}</p>
                    )}
                    <time className="block text-[10px] text-white/30">
                      {new Date(post.created_at).toLocaleString('ja-JP')}
                    </time>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* 撮影ボタン（フローティング） */}
      {user && posts.length > 0 && (
        <Link
          href="/capture"
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 shadow-lg shadow-primary-500/30 transition-colors hover:bg-primary-400"
          aria-label="撮影へ"
        >
          <Camera size={24} className="text-black" />
        </Link>
      )}
    </div>
  );
}
