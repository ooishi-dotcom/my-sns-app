'use client';

import { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, ArrowCounterClockwise } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

// カメラ撮影コンポーネント
// react-webcam を使ってカメラのプレビューと撮影機能を提供する
// TODO: 受講者が AI に依頼して撮影した写真を Supabase Storage にアップロードする
export default function CameraCapture() {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
    }
  }, []);

  const retake = () => {
    setCapturedImage(null);
  };

  if (capturedImage) {
    return (
      <div className="flex flex-col items-center gap-4">
        {/* 撮影した写真のプレビュー */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={capturedImage}
          alt="撮影した写真"
          className="w-full max-w-sm rounded-lg shadow-md"
        />
        <div className="flex gap-3 w-full max-w-sm">
          <Button variant="outline" onClick={retake} className="flex-1 gap-2">
            <ArrowCounterClockwise size={16} />
            撮り直す
          </Button>
          {/* TODO: 受講者がここに「投稿する」ボタンと Supabase Storage へのアップロード処理を追加する */}
          <Button className="flex-1" disabled>
            投稿する（未実装）
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
