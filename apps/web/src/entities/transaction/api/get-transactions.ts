import 'server-only';
import {
  type ListTransactionsQueryInput,
  type TransactionPage,
  transactionPageSchema,
  type TransactionSummary,
  transactionSummarySchema,
} from '@expense-tracker/shared';
import { authedFetch } from '@/shared/api/session';

/** Страница транзакций текущего пользователя с фильтрами. */
export function getTransactions(
  query: ListTransactionsQueryInput = {},
): Promise<TransactionPage> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  return authedFetch(`/transactions?${params}`, transactionPageSchema);
}

/** Доходы, расходы и итоги по категориям за месяц. */
export function getMonthSummary(
  month: number,
  year: number,
): Promise<TransactionSummary> {
  return authedFetch(
    `/transactions/summary?month=${month}&year=${year}`,
    transactionSummarySchema,
  );
}
