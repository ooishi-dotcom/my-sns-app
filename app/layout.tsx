import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '失敗しない接待レストラン',
  description: '接待で使える高級レストラン・料理を記録して共有するアプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <main className="min-h-screen text-foreground">
          {children}
        </main>
      </body>
    </html>
  );
}