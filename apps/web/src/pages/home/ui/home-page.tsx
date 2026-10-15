import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCategories } from '@/entities/category';
import { getMonthSummary, getTransactions } from '@/entities/transaction';
import { getCurrentUser } from '@/entities/user';
import { TransactionFormDialog } from '@/features/manage-transaction';
import { MonthSummary } from '@/widgets/month-summary';
import { TransactionsList } from '@/widgets/transactions-list';
import { formatMonth } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';
import { PageHeader } from '@/shared/ui/page-header';

export const metadata: Metadata = { title: 'Главная · Expense Tracker' };

const RECENT_COUNT = 5;

export async function HomePage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [user, summary, recent, categories] = await Promise.all([
    getCurrentUser(),
    getMonthSummary(month, year),
    getTransactions({ pageSize: RECENT_COUNT }),
    getCategories(),
  ]);
  // Layout уже проверил пользователя, здесь только сужаем тип.
  if (!user) redirect('/logout');

  return (
    <div className="grid gap-6">
      <PageHeader
        title={`Привет, ${user.name}!`}
        description={`Сводка за ${formatMonth(month, year)}`}
        actions={
          <TransactionFormDialog
            categories={categories}
            trigger={
              <Button>
                <Plus />
                Добавить транзакцию
              </Button>
            }
          />
        }
      />

      <MonthSummary summary={summary} />

      <Card>
        <CardHeader>
          <CardTitle>Последние операции</CardTitle>
          <CardAction>
            <Button
              variant="link"
              nativeButton={false}
              render={<Link href="/transactions" />}
            >
              Все транзакции
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <TransactionsList
            transactions={recent.items}
            categories={categories}
            emptyText="Операций пока нет. Добавьте первую транзакцию."
          />
        </CardContent>
      </Card>
    </div>
  );
}
