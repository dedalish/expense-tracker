import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/features/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { LogoMark } from '@/shared/ui/logo-mark';

export const metadata: Metadata = { title: 'Регистрация · Expense Tracker' };

export function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-10">
      <div className="flex items-center gap-3 text-lg font-semibold tracking-tight">
        <LogoMark className="size-10 text-primary" />
        Expense Tracker
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Регистрация</CardTitle>
          <CardDescription>
            Создайте аккаунт, чтобы вести расходы
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
        <CardFooter className="justify-center bg-muted text-sm text-muted-foreground">
          Уже есть аккаунт?&nbsp;
          <Link href="/login" className="text-foreground underline">
            Войти
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
