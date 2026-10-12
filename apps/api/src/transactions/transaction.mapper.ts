import type { Transaction } from '@expense-tracker/shared';
import type { Transaction as TransactionEntity } from '../generated/prisma/client.js';

/** `YYYY-MM-DD` → Date на полночь UTC (колонка `@db.Date`). */
export function toDbDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

/** Date из колонки `@db.Date` → `YYYY-MM-DD`. */
export function fromDbDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Транзакция для ответа API: без `userId`, сумма строкой. */
export function toTransactionResponse(
  transaction: TransactionEntity,
): Transaction {
  return {
    id: transaction.id,
    amount: transaction.amount.toFixed(2),
    type: transaction.type,
    description: transaction.description,
    date: fromDbDate(transaction.date),
    categoryId: transaction.categoryId,
    createdAt: transaction.createdAt.toISOString(),
  };
}
