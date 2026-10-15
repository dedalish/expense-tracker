import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCategories } from '@/entities/category';
import { getMonthSummary, getTransactions } from '@/entities/transaction';
import { getCurrentUser } from '@/entities/user';
import { TransactionFormDialog } from '@/features/manage-transaction';
import { type MonthOption, MonthSelect } from '@/features/select-month';
import { MonthSummary } from '@/widgets/month-summary';
import { TransactionsList } from '@/widgets/transactions-list';
import { getUserTimeZone } from '@/shared/api/time-zone';
import { formatMonth } from '@/shared/lib/format';
import {
  currentMonth,
  isSameMonth,
  parseMonthParam,
  recentMonths,
  toMonthParam,
  type YearMonth,
} from '@/shared/lib/month';
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
/** Сколько месяцев назад можно выбрать в списке. */
const MONTH_OPTIONS = 12;

export async function HomePage({ searchParams }: PageProps<'/'>) {
  const { month: monthParam } = await searchParams;
  // «Текущий» месяц — в поясе браузера (cookie), а не сервера.
  const today = currentMonth(await getUserTimeZone());
  const selected =
    monthParam === undefined ? today : parseMonthParam(monthParam);
  // Битый `?month=` убираем из адреса, а не показываем ошибку.
  if (!selected) redirect('/');

  const [user, summary, recent, categories] = await Promise.all([
    getCurrentUser(),
    getMonthSummary(selected.month, selected.year),
    getTransactions({ pageSize: RECENT_COUNT }),
    getCategories(),
  ]);
  // Layout уже проверил пользователя, здесь только сужаем тип.
  if (!user) redirect('/logout');

  return (
    <div className="grid gap-6">
      <PageHeader
        title={`Привет, ${user.name}!`}
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

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Сводка за</span>
        <MonthSelect
          value={toMonthParam(selected)}
          defaultValue={toMonthParam(today)}
          options={monthOptions(today, selected)}
        />
      </div>

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

/**
 * Последние месяцы от текущего. Месяц из URL вне этого списка (старый
 * или будущий) добавляется, чтобы в списке было видно выбранное.
 */
function monthOptions(today: YearMonth, selected: YearMonth): MonthOption[] {
  const months = recentMonths(today, MONTH_OPTIONS);
  if (!months.some((month) => isSameMonth(month, selected))) {
    months.push(selected);
    months.sort((a, b) => b.year - a.year || b.month - a.month);
  }
  return months.map((month) => ({
    value: toMonthParam(month),
    label: formatMonth(month.month, month.year),
  }));
}
