import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 遷移先: next が指定されていればそこへ（例: パスワード再設定画面）
  // オープンリダイレクト対策として、内部パス（/始まり かつ //でない）のみ許可
  const next = requestUrl.searchParams.get('next');
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';

  return NextResponse.redirect(requestUrl.origin + safeNext);
}
