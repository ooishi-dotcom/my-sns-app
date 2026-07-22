'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Webcam from 'react-webcam';
import {
  Camera,
  ArrowCounterClockwise,
  Star,
  VideoCamera,
  Image as ImageIcon,
  Stop,
  FolderOpen,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

// 価格帯の選択肢（value は API / DB と一致させる）
const PRICE_RANGES = [
  { value: '1000-5000', label: '¥1,000〜5,000' },
  { value: '5001-10000', label: '¥5,001〜10,000' },
  { value: '10000+', label: '¥10,000〜' },
] as const;

// 撮影/選択したメディア
type Captured = {
  url: string; // プレビュー用URL（dataURL または blob URL）
  blob: Blob; // アップロードするデータ本体
  type: 'image' | 'video';
};

// ブラウザが対応している録画形式を選ぶ
function pickVideoMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return '';
}

// カメラ撮影／動画録画／ファイル選択に対応した投稿コンポーネント
export default function CameraCapture() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [recording, setRecording] = useState(false);
  const [captured, setCaptured] = useState<Captured | null>(null);

  const [caption, setCaption] = useState('');
  const [taste, setTaste] = useState('');
  const [priceRange, setPriceRange] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // プレビュー用の blob URL をメモリから解放する
  const revokeIfBlobUrl = (url?: string) => {
    if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
  };

  useEffect(() => {
    // アンマウント時に残っている blob URL を解放
    return () => revokeIfBlobUrl(captured?.url);
  }, [captured?.url]);

  // 写真を撮る
  const capturePhoto = useCallback(async () => {
    const shot = webcamRef.current?.getScreenshot();
    if (!shot) return;
    const blob = await (await fetch(shot)).blob();
    setCaptured({ url: shot, blob, type: 'image' });
  }, []);

  // 動画の録画を開始
  const startRecording = useCallback(() => {
    setError(null);
    const stream = webcamRef.current?.stream;
    if (!stream) {
      setError('カメラを準備中です。少し待ってからもう一度お試しください。');
      return;
    }
    const mimeType = pickVideoMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      setError('このブラウザは動画の録画に対応していません。ファイル選択をご利用ください。');
      return;
    }
    recordedChunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const type = recorder.mimeType || mimeType || 'video/webm';
      const blob = new Blob(recordedChunksRef.current, { type });
      const url = URL.createObjectURL(blob);
      setCaptured({ url, blob, type: 'video' });
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
  }, []);

  // 動画の録画を停止
  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
  }, []);

  // 端末内のファイル（写真/動画）を選ぶ
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 同じファイルを再選択できるようにクリア
    if (!file) return;
    const type: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setError('写真または動画のファイルを選んでください。');
      return;
    }
    setError(null);
    revokeIfBlobUrl(captured?.url);
    setCaptured({ url: URL.createObjectURL(file), blob: file, type });
  };

  const retake = () => {
    revokeIfBlobUrl(captured?.url);
    setCaptured(null);
    setCaption('');
    setTaste('');
    setPriceRange('');
    setRating(0);
    setError(null);
  };

  // 投稿する
  const handlePost = async () => {
    if (!captured) return;

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
      const ext =
        captured.blob.type.split('/')[1]?.split(';')[0] ||
        (captured.type === 'video' ? 'webm' : 'jpg');

      const formData = new FormData();
      formData.append('media', captured.blob, `upload.${ext}`);
      formData.append('caption', caption);
      formData.append('taste', taste);
      formData.append('price_range', priceRange);
      formData.append('rating', String(rating));

      const res = await fetch('/api/posts', { method: 'POST', body: formData });

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

  // ===== 撮影/選択したあとの確認・投稿フォーム =====
  if (captured) {
    return (
      <div className="flex flex-col items-center gap-5">
        {/* プレビュー（写真 or 動画） */}
        {captured.type === 'video' ? (
          <video
            src={captured.url}
            controls
            playsInline
            className="w-full max-w-sm rounded-lg border border-primary-500/40 shadow-lg shadow-black/50"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={captured.url}
            alt="撮影した写真"
            className="w-full max-w-sm rounded-lg border border-primary-500/40 shadow-lg shadow-black/50"
          />
        )}

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

  // ===== 撮影/録画/ファイル選択の画面 =====
  return (
    <div className="flex flex-col items-center gap-4">
      {/* 写真 / 動画 モード切り替え */}
      <div className="flex w-full max-w-sm rounded-md border border-input p-1">
        <button
          type="button"
          onClick={() => !recording && setMode('photo')}
          disabled={recording}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${
            mode === 'photo' ? 'bg-primary-500 text-black' : 'text-foreground'
          }`}
        >
          <ImageIcon size={16} />
          写真
        </button>
        <button
          type="button"
          onClick={() => !recording && setMode('video')}
          disabled={recording}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${
            mode === 'video' ? 'bg-primary-500 text-black' : 'text-foreground'
          }`}
        >
          <VideoCamera size={16} />
          動画
        </button>
      </div>

      {/* カメラプレビュー（動画モードでは音声も収録） */}
      <div className="relative w-full max-w-sm">
        <Webcam
          ref={webcamRef}
          audio={mode === 'video'}
          muted
          screenshotFormat="image/jpeg"
          className="w-full rounded-lg shadow-md"
        />
        {recording && (
          <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-red-400 backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            録画中
          </span>
        )}
      </div>

      {/* 撮影 / 録画ボタン */}
      {mode === 'photo' ? (
        <Button onClick={capturePhoto} size="lg" className="w-full max-w-sm gap-2">
          <Camera size={20} />
          撮影する
        </Button>
      ) : recording ? (
        <Button
          onClick={stopRecording}
          size="lg"
          variant="destructive"
          className="w-full max-w-sm gap-2"
        >
          <Stop size={20} weight="fill" />
          録画を停止
        </Button>
      ) : (
        <Button onClick={startRecording} size="lg" className="w-full max-w-sm gap-2">
          <VideoCamera size={20} />
          録画を開始
        </Button>
      )}

      {/* 端末内のファイルを選ぶ */}
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={recording}
        className="w-full max-w-sm gap-2"
      >
        <FolderOpen size={18} />
        写真・動画をファイルから選ぶ
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <p className="w-full max-w-sm rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
