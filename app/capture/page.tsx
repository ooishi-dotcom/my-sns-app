import CameraCapture from '@/components/CameraCapture';

// 撮影画面
// CameraCapture コンポーネントを呼び出す
// TODO: 受講者が AI に依頼して撮影した写真を Supabase Storage にアップロードする処理を追加する
export default function CapturePage() {
  return (
    <div className="max-w-lg mx-auto min-h-screen">
      <header className="sticky top-0 z-10 border-b border-primary-500/30 bg-black/80 px-4 py-3 backdrop-blur">
        <h1 className="font-serif-lux text-lg font-bold tracking-wide text-primary-300">一皿を記録する</h1>
      </header>
      <main className="px-4 py-6">
        <CameraCapture />
      </main>
    </div>
  );
}
