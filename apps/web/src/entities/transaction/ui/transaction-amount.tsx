import type { Transaction } from '@expense-tracker/shared';
import { formatMoney } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';

type TransactionAmountProps = Pick<Transaction, 'amount' | 'type'> & {
  className?: string;
};

/** Сумма со знаком: доход зелёным с «+», расход с «−». */
export function TransactionAmount({
  amount,
  type,
  className,
}: TransactionAmountProps) {
  const income = type === 'INCOME';
  return (
    <span
      className={cn(
        'font-medium whitespace-nowrap tabular-nums',
        income && 'text-emerald-600 dark:text-emerald-400',
        className,
      )}
    >
      {income ? '+' : '−'}
      {formatMoney(amount)}
    </span>
  );
}
