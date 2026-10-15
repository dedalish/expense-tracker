import type { Transaction } from '@expense-tracker/shared';
import type { ReactNode } from 'react';
import { formatDate } from '@/shared/lib/format';
import { TransactionAmount } from './transaction-amount';

interface TransactionRowProps {
  transaction: Transaction;
  /** Категория: её показывает слой выше, entity о категориях не знает. */
  category: ReactNode;
  /** Кнопки действий справа. */
  actions?: ReactNode;
}

export function TransactionRow({
  transaction,
  category,
  actions,
}: TransactionRowProps) {
  return (
    <li className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="min-w-0 text-sm font-medium">{category}</div>
        <div className="mt-0.5 truncate pl-9 text-xs text-muted-foreground">
          {formatDate(transaction.date)}
          {transaction.description && ` · ${transaction.description}`}
        </div>
      </div>
      <TransactionAmount amount={transaction.amount} type={transaction.type} />
      {actions && <div className="flex shrink-0 gap-1">{actions}</div>}
    </li>
  );
}
