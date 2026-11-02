import type { TransactionSummary } from '@expense-tracker/shared';
import { ArrowDownLeft, ArrowUpRight, type LucideIcon } from 'lucide-react';
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
import { SpendGauge } from './spend-gauge';

const TOP_CATEGORIES = 5;

/**
 * Итоги месяца плиткой: доходы, расходы, баланс (карточка-акцент),
 * крупнейшие категории расходов и доля потраченного от доходов.
 */
export function MonthSummary({ summary }: { summary: TransactionSummary }) {
  // byCategory уже отсортирован api по убыванию суммы.
  const expenses = summary.byCategory
    .filter((item) => item.type === 'EXPENSE')
    .slice(0, TOP_CATEGORIES);
  const totalExpense = Number(summary.expense);

  return (
    <div className="grid gap-4 md:grid-cols-6 lg:grid-cols-12">
      <StatCard
        label="Доходы"
        value={formatMoney(summary.income)}
        icon={ArrowDownLeft}
        iconClassName="bg-income-soft text-income"
        className="md:col-span-3 lg:col-span-4"
      />
      <StatCard
        label="Расходы"
        value={formatMoney(summary.expense)}
        icon={ArrowUpRight}
        iconClassName="bg-expense-soft text-expense"
        className="md:col-span-3 lg:col-span-4"
      />
      <BalanceCard
        balance={summary.balance}
        className="md:col-span-6 lg:col-span-4"
      />

      <Card className="md:col-span-6 lg:col-span-7">
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
            <ul className="grid gap-5">
              {expenses.map((item) => {
                const share =
                  totalExpense > 0
                    ? (Number(item.total) / totalExpense) * 100
                    : 0;
                return (
                  <li key={item.categoryId} className="grid gap-2">
                    <div className="flex items-center gap-3 text-sm">
                      <CategoryIcon category={item} className="size-8" />
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {item.name}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {Math.round(share)}%
                      </span>
                      <span className="w-28 text-right font-semibold tabular-nums">
                        {formatMoney(item.total)}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
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

      <Card className="md:col-span-6 lg:col-span-5">
        <CardHeader>
          <CardTitle>Потрачено из доходов</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-center">
          <SpendGauge income={summary.income} expense={summary.expense} />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName,
  className,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClassName: string;
  className?: string;
}) {
  return (
    <Card className={cn('justify-center', className)}>
      <CardContent className="flex items-center gap-4">
        <span
          aria-hidden
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-full',
            iconClassName,
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="truncate text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Баланс месяца — единственная цветная карточка на экране. */
function BalanceCard({
  balance,
  className,
}: {
  balance: string;
  className?: string;
}) {
  const value = Number(balance);
  return (
    <Card
      className={cn(
        'relative justify-center bg-linear-to-br from-hero to-hero-deep text-hero-foreground',
        className,
      )}
    >
      <CardContent className="relative z-10 grid gap-1">
        <div className="text-sm text-hero-foreground/75">Баланс месяца</div>
        <div className="truncate text-3xl font-semibold tracking-tight tabular-nums">
          {formatMoney(balance)}
        </div>
        <div className="text-sm text-hero-foreground/75">
          {value > 0 && 'Доходы больше расходов'}
          {value < 0 && 'Расходы больше доходов'}
          {value === 0 && 'Доходы и расходы равны'}
        </div>
      </CardContent>
      {/* Волна-подпись в углу, как росчерк на банковской карте. */}
      <svg
        aria-hidden
        viewBox="0 0 120 60"
        className="absolute top-1/2 right-5 h-14 -translate-y-1/2 text-hero-foreground/35"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      >
        <path d="M5 50 C 25 50, 25 12, 45 12 S 62 48, 78 40 S 98 8, 115 10" />
      </svg>
    </Card>
  );
}
