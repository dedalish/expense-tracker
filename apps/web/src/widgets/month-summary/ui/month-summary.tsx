import type { TransactionSummary } from '@expense-tracker/shared';
import { CategoryIcon } from '@/entities/category';
import { formatMoney } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card';

const TOP_CATEGORIES = 5;

/** Итоги месяца: доходы, расходы, баланс и крупнейшие категории расходов. */
export function MonthSummary({ summary }: { summary: TransactionSummary }) {
  const balance = Number(summary.balance);
  // byCategory уже отсортирован api по убыванию суммы.
  const expenses = summary.byCategory
    .filter((item) => item.type === 'EXPENSE')
    .slice(0, TOP_CATEGORIES);
  const totalExpense = Number(summary.expense);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Доходы" value={formatMoney(summary.income)} />
        <StatCard label="Расходы" value={formatMoney(summary.expense)} />
        <StatCard
          label="Баланс"
          value={formatMoney(summary.balance)}
          className={cn(
            balance > 0 && 'text-emerald-600 dark:text-emerald-400',
            balance < 0 && 'text-destructive',
          )}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Куда уходят деньги</CardTitle>
          <CardDescription>Крупнейшие категории расходов</CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              В этом месяце расходов пока нет.
            </p>
          ) : (
            <ul className="grid gap-4">
              {expenses.map((item) => {
                const share =
                  totalExpense > 0
                    ? (Number(item.total) / totalExpense) * 100
                    : 0;
                return (
                  <li key={item.categoryId} className="grid gap-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <CategoryIcon
                        category={item}
                        className="size-6 text-xs"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {item.name}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {Math.round(share)}%
                      </span>
                      <span className="font-medium tabular-nums">
                        {formatMoney(item.total)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        // Ширина и цвет из данных, классами Tailwind не задать.
                        style={{
                          width: `${share}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className={cn('text-2xl tabular-nums', className)}>
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
