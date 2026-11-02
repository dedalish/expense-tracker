import { formatMoney } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';

/** Полудуга: путь от левого края к правому через верх. */
const ARC = 'M 12 100 A 88 88 0 0 1 188 100';

/** Доля расходов от доходов месяца на полукруглой шкале. */
export function SpendGauge({
  income,
  expense,
}: {
  income: string;
  expense: string;
}) {
  const incomeValue = Number(income);
  const expenseValue = Number(expense);

  if (incomeValue <= 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Доходов в этом месяце нет, сравнивать расходы не с чем.
      </p>
    );
  }

  const share = Math.round((expenseValue / incomeValue) * 100);
  const over = share > 100;
  const left = incomeValue - expenseValue;

  return (
    <div className="grid justify-items-center gap-3">
      <div className="relative w-full max-w-64">
        <svg
          viewBox="0 0 200 108"
          className="w-full"
          role="img"
          aria-label={`Потрачено ${share}% доходов`}
        >
          <path
            d={ARC}
            fill="none"
            strokeWidth="22"
            strokeLinecap="round"
            className="stroke-accent"
          />
          {share > 0 && (
            <path
              d={ARC}
              fill="none"
              strokeWidth="22"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${Math.min(share, 100)} 100`}
              className={over ? 'stroke-expense' : 'stroke-primary'}
            />
          )}
        </svg>
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 text-center text-4xl font-semibold tracking-tight tabular-nums',
            over && 'text-expense',
          )}
        >
          {share}%
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {over
          ? `Расходы превысили доходы на ${formatMoney(String(-left))}`
          : `Осталось ${formatMoney(String(left))} из ${formatMoney(income)}`}
      </p>
    </div>
  );
}
