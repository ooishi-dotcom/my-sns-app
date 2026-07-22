'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// パスワードリセット画面
// Supabase Auth のパスワード更新フローに対応
export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmedPassword, setConfirmedPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user.email) {
        router.push('/login');
      }
    };
    checkSession();
  }, [router, supabase]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmedPassword) {
      setMessage({ type: 'error', text: 'パスワードが一致しません。' });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setMessage({ type: 'success', text: 'パスワードを更新しました。新しいパスワードでログインしてください。' });
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'エラーが発生しました。';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-primary-500/25 shadow-lg shadow-black/50">
        <CardHeader>
          <CardTitle className="font-serif-lux text-center text-2xl font-bold text-primary-300">
            パスワードをリセット
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-primary-400 mb-1">
                新しいパスワード
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8文字以上"
                required
                minLength={8}
              />
            </div>
            <div>
              <label htmlFor="confirmedPassword" className="block text-sm font-medium text-primary-400 mb-1">
                パスワードの確認
              </label>
              <Input
                id="confirmedPassword"
                type="password"
                value={confirmedPassword}
                onChange={(e) => setConfirmedPassword(e.target.value)}
                placeholder="もう一度入力"
                required
                minLength={8}
              />
            </div>

            {message && (
              <div
                className={`rounded-md p-3 text-sm ${
                  message.type === 'success'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/40'
                    : 'bg-red-500/10 text-red-400 border border-red-500/40'
                }`}
              >
                {message.text}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '処理中...' : 'パスワードを更新する'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <Link href="/login" className="text-primary-400 hover:underline">
              ログインに戻る
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
