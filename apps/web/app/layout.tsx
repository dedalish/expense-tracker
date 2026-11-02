import type { Metadata } from 'next';
import { Onest } from 'next/font/google';
import '@/app/styles/globals.css';

// Onest — геометрический гротеск с родной кириллицей. Переменная
// --font-sans используется темой shadcn в globals.css.
const sans = Onest({ subsets: ['latin', 'cyrillic'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Expense Tracker',
  description: 'Трекер расходов',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ru" className={sans.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
