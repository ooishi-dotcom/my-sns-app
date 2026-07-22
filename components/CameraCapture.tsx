'use client';

import { useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Webcam from 'react-webcam';
import { Camera, ArrowCounterClockwise, Star } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

// 価格帯の選択肢（value は API / DB と一致させる）
const PRICE_RANGES = [
  { value: '1000-5000', label: '¥1,000〜5,000' },
  { value: '5001-10000', label: '¥5,001〜10,000' },
  { value: '10000+', label: '¥10,000〜' },
] as const;

// カメラ撮影コンポーネント
// react-webcam でプレビュー・撮影し、撮った写真を Supabase Storage
// (post-images バケット) にアップロードして投稿する
export default function CameraCapture() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [taste, setTaste] = useState('');
  const [priceRange, setPriceRange] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, []);

  const retake = () => {
    setCapturedImage(null);
    setCaption('');
    setTaste('');
    setPriceRange('');
    setRating(0);
    setError(null);
  };

  // 撮影した写真を投稿する
  const handlePost = async () => {
    if (!capturedImage) return;

    // 全項目必須のチェック
    if (!caption.trim()) {
      setError('店名・料理名を入力してください');
      return;
    }
    if (!taste.trim()) {
      setError('味の感想を入力してください');
      return;
    }
    if (!priceRange) {
      setError('価格帯を選択してください');
      return;
    }
    if (rating < 1) {
      setError('評価（★1〜5）を選択してください');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // dataURL(base64) を Blob に変換して multipart で送る
      const blob = await (await fetch(capturedImage)).blob();
      const formData = new FormData();
      formData.append('image', blob, 'photo.jpg');
      formData.append('caption', caption);
      formData.append('taste', taste);
      formData.append('price_range', priceRange);
      formData.append('rating', String(rating));

      const res = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? '投稿に失敗しました');
      }

      // 投稿成功 → タイムラインへ
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '投稿に失敗しました');
      setUploading(false);
    }
  };

  if (capturedImage) {
    return (
      <div className="flex flex-col items-center gap-5">
        {/* 撮影した写真のプレビュー */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={capturedImage}
          alt="撮影した写真"
          className="w-full max-w-sm rounded-lg border border-primary-500/40 shadow-lg shadow-black/50"
        />

        <div className="w-full max-w-sm space-y-5">
          {/* 店名・料理名 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-400">
              店名・料理名 <span className="text-primary-500">*</span>
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="例）銀座 鮨処 / 大トロの握り"
              disabled={uploading}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
            />
          </div>

          {/* 味の感想 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-400">
              味の感想 <span className="text-primary-500">*</span>
            </label>
            <textarea
              value={taste}
              onChange={(e) => setTaste(e.target.value)}
              placeholder="例）とろける食感で上品な旨み。接待にぴったり。"
              rows={3}
              disabled={uploading}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
            />
          </div>

          {/* 価格帯 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-400">
              価格帯 <span className="text-primary-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRICE_RANGES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriceRange(p.value)}
                  disabled={uploading}
                  className={`rounded-md border px-2 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
                    priceRange === p.value
                      ? 'border-primary-500 bg-primary-500 text-black'
                      : 'border-input bg-background text-foreground hover:border-primary-500/60'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* ★評価 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-primary-400">
              評価 <span className="text-primary-500">*</span>
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  disabled={uploading}
                  aria-label={`星${n}`}
                  className="transition-transform hover:scale-110 disabled:opacity-50"
                >
                  <Star
                    size={32}
                    weight={n <= rating ? 'fill' : 'regular'}
                    className={n <= rating ? 'text-primary-500' : 'text-muted-foreground'}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-primary-400">{rating}.0</span>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="w-full max-w-sm rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="flex w-full max-w-sm gap-3">
          <Button
            variant="outline"
            onClick={retake}
            disabled={uploading}
            className="flex-1 gap-2"
          >
            <ArrowCounterClockwise size={16} />
            撮り直す
          </Button>
          <Button onClick={handlePost} disabled={uploading} className="flex-1">
            {uploading ? '投稿中...' : '投稿する'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* カメラプレビュー */}
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="w-full max-w-sm rounded-lg shadow-md"
        // PC: フロントカメラ（user）/ スマートフォン: アウトカメラ（environment）
        // ブラウザがデバイスに合わせて最適なカメラを選択するため、
        // 受講者が後から AI に依頼して facingMode を変更できるようコメントで残す
        // videoConstraints={{ facingMode: 'environment' }}
      />
      <Button onClick={capture} size="lg" className="gap-2 w-full max-w-sm">
        <Camera size={20} />
        撮影する
      </Button>
    </div>
  );
}
