'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ログイン画面
// Supabase Auth（メールアドレス + パスワード）を使ったログイン・新規登録
export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/');
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setMessage({ type: 'success', text: '確認メールを送信しました。メールを確認してください。' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'エラーが発生しました';
      setMessage({ type: 'error', text: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            {mode === 'signin' ? 'ログイン' : 'アカウント作成'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8文字以上"
                required
              />
            </div>

            {message && (
              <div
                className={`rounded-md p-3 text-sm ${
                  message.type === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '処理中...' : mode === 'signin' ? 'ログイン' : 'アカウント作成'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            {mode === 'signin' ? (
              <>
                アカウントをお持ちでない方は{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setMessage(null); }}
                  className="text-primary-600 hover:underline font-medium"
                >
                  新規登録
                </button>
              </>
            ) : (
              <>
                すでにアカウントをお持ちの方は{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setMessage(null); }}
                  className="text-primary-600 hover:underline font-medium"
                >
                  ログイン
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
