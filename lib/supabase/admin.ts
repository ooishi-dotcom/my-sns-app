import { createClient } from '@supabase/supabase-js';

// サーバー専用の管理クライアント（service_role キーを使用）
// RLS（行レベルセキュリティ）をバイパスするため、非常に強力。
// ⚠️ 絶対にブラウザ／クライアントコンポーネントから import しないこと。
//    Route Handler など「サーバー側」でのみ使う。
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY が設定されていません（.env.local を確認してください）'
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
