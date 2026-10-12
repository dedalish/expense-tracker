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

export const metadata: Metadata = { title: 'Регистрация · Expense Tracker' };

export function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Регистрация</CardTitle>
          <CardDescription>
            Создайте аккаунт, чтобы вести расходы
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          Уже есть аккаунт?&nbsp;
          <Link href="/login" className="text-foreground underline">
            Войти
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
