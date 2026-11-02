import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/features/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { LogoMark } from '@/shared/ui/logo-mark';

export const metadata: Metadata = { title: 'Вход · Expense Tracker' };

export function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-10">
      <div className="flex items-center gap-3 text-lg font-semibold tracking-tight">
        <LogoMark className="size-10 text-primary" />
        Expense Tracker
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Вход</CardTitle>
          <CardDescription>Войдите, чтобы продолжить</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link href="/privacy" className="underline">
              Политика обработки персональных данных
            </Link>
          </p>
        </CardContent>
        <CardFooter className="justify-center bg-muted text-sm text-muted-foreground">
          Нет аккаунта?&nbsp;
          <Link href="/register" className="text-foreground underline">
            Зарегистрироваться
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
