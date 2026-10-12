import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/entities/user';
import { Header } from '@/widgets/header';
import { getHealth } from '@/shared/api/health';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export async function HomePage() {
  const user = await getCurrentUser();
  // Cookie есть (иначе proxy не пустил бы), но api токен не принял.
  if (!user) redirect('/logout');

  const health = await getHealth();

  return (
    <>
      <Header user={user} />
      <main className="mx-auto flex max-w-xl flex-col gap-6 px-6 py-10">
        <h1 className="text-3xl font-semibold">Привет, {user.name}!</h1>

        <Card>
          <CardHeader>
            <CardTitle>Состояние сервисов</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <StatusRow label="API" ok={health !== null} />
              <StatusRow label="База данных" ok={health?.database === 'up'} />
            </ul>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <span>{label}</span>
      <span className={ok ? 'text-emerald-600' : 'text-destructive'}>
        {ok ? 'работает' : 'не отвечает'}
      </span>
    </li>
  );
}
