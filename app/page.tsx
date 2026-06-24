import Link from 'next/link';
import { Camera } from '@phosphor-icons/react/dist/ssr';

// タイムライン画面（ホーム）
// TODO: 受講者が AI に依頼して posts テーブルからデータを取得し、ここに表示する
export default function Home() {
  // 現状は空のタイムライン（posts テーブル未作成）
  const posts: unknown[] = [];

  return (
    <div className="max-w-lg mx-auto min-h-screen">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Vibe SNS</h1>
          <Link
            href="/login"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            ログイン
          </Link>
        </div>
      </header>

      {/* タイムライン */}
      <main className="px-4 py-6">
        {posts.length === 0 ? (
          // 空状態: 投稿がまだない場合のUI
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-6">
              <Camera size={48} className="text-gray-400" />
            </div>
            <p className="mb-6 text-gray-600">
              まだ投稿がありません。カメラで撮影してみましょう。
            </p>
            <Link
              href="/capture"
              className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-6 py-3 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
            >
              <Camera size={18} />
              撮影へ
            </Link>
          </div>
        ) : (
          // TODO: posts を受け取ってここに表示する
          <div className="space-y-4">
            {/* 投稿リストはここに表示 */}
          </div>
        )}
      </main>

      {/* 撮影ボタン（フローティング） */}
      {posts.length > 0 && (
        <Link
          href="/capture"
          className="fixed bottom-6 right-6 flex items-center justify-center w-14 h-14 rounded-full bg-primary-600 shadow-lg hover:bg-primary-700 transition-colors"
          aria-label="撮影へ"
        >
          <Camera size={24} className="text-white" />
        </Link>
      )}
    </div>
  );
}
