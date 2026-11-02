import type { Transaction } from '@expense-tracker/shared';
import { formatMoney } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';

type TransactionAmountProps = Pick<Transaction, 'amount' | 'type'> & {
  className?: string;
};

/** Сумма со знаком на плашке: доход зелёная с «+», расход красноватая с «−». */
export function TransactionAmount({
  amount,
  type,
  className,
}: TransactionAmountProps) {
  const income = type === 'INCOME';
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-sm font-semibold whitespace-nowrap tabular-nums',
        income ? 'bg-income-soft text-income' : 'bg-expense-soft text-expense',
        className,
      )}
    >
      {income ? '+' : '−'}
      {formatMoney(amount)}
    </span>
  );
}
