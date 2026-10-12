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

export const metadata: Metadata = { title: 'Вход · Expense Tracker' };

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Вход</CardTitle>
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
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Нет аккаунта?&nbsp;
          <Link href="/register" className="text-foreground underline">
            Зарегистрироваться
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
