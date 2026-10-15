import type { Category, Transaction } from '@expense-tracker/shared';
import { Pencil } from 'lucide-react';
import { CategoryBadge } from '@/entities/category';
import { TransactionRow } from '@/entities/transaction';
import {
  DeleteTransactionButton,
  TransactionFormDialog,
} from '@/features/manage-transaction';
import { Button } from '@/shared/ui/button';

interface TransactionsListProps {
  transactions: Transaction[];
  categories: Category[];
  emptyText: string;
}

/** Список транзакций с кнопками изменения и удаления. */
export function TransactionsList({
  transactions,
  categories,
  emptyText,
}: TransactionsListProps) {
  if (transactions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    );
  }

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return (
    <ul className="divide-y">
      {transactions.map((transaction) => {
        const category = categoryById.get(transaction.categoryId);
        return (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            category={
              category ? <CategoryBadge category={category} /> : 'Без категории'
            }
            actions={
              <>
                <TransactionFormDialog
                  categories={categories}
                  transaction={transaction}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Изменить транзакцию"
                    >
                      <Pencil />
                    </Button>
                  }
                />
                <DeleteTransactionButton id={transaction.id} />
              </>
            }
          />
        );
      })}
    </ul>
  );
}
