import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/entities/user';
import { LogoutButton } from '@/features/auth';
import { ProfileNameForm } from '@/features/update-profile';
import { formatDateTime } from '@/shared/lib/format';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { PageHeader } from '@/shared/ui/page-header';

export const metadata: Metadata = { title: 'Профиль · Expense Tracker' };

export async function ProfilePage() {
  const user = await getCurrentUser();
  // Layout уже проверил пользователя, здесь только сужаем тип.
  if (!user) redirect('/logout');

  return (
    <div className="grid max-w-xl gap-6">
      <PageHeader title="Профиль" />

      <Card>
        <CardHeader>
          <CardTitle>Аккаунт</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="truncate">{user.email}</dd>
            <dt className="text-muted-foreground">Зарегистрирован</dt>
            <dd>{formatDateTime(user.createdAt)}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Имя</CardTitle>
          <CardDescription>Так к вам обращается приложение</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileNameForm name={user.name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Выход</CardTitle>
          <CardDescription>Завершить сессию на этом устройстве</CardDescription>
        </CardHeader>
        <CardContent>
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}
