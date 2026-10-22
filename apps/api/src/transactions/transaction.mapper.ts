import type { Transaction } from '@expense-tracker/shared';
import type { Transaction as TransactionEntity } from '../generated/prisma/client.js';

/**
 * Дата API → значение для колонки `@db.Date`.
 *
 * @param date Дата `YYYY-MM-DD`, уже проверенная схемой из shared.
 * @returns Date на полночь UTC этого дня. Строка в другом формате даёт
 *   `Invalid Date` без исключения, поэтому формат проверяет схема.
 */
export function toDbDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

/**
 * Значение колонки `@db.Date` → дата API.
 *
 * @param date Date из БД (полночь UTC).
 * @returns Дата `YYYY-MM-DD` по UTC.
 * @throws {RangeError} `date` — `Invalid Date`.
 */
export function fromDbDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Запись БД → транзакция для ответа API.
 *
 * @param transaction Запись `prisma.transaction`.
 * @returns Транзакция без `userId`: сумма строкой с двумя знаками,
 *   `date` как `YYYY-MM-DD`, `createdAt` в ISO 8601.
 */
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
