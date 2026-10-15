import {
  type ListTransactionsQuery,
  listTransactionsQuerySchema,
  TRANSACTIONS_PAGE_SIZE,
} from '@expense-tracker/shared';

/** Параметры URL страницы транзакций, которые задаёт интерфейс. */
const SEARCH_KEYS = ['type', 'categoryId', 'page'] as const;

export type TransactionsSearch = Partial<
  Record<(typeof SEARCH_KEYS)[number], string>
>;

type RawSearchParams = Record<string, string | string[] | undefined>;

/**
 * Оставляет из URL только известные и корректные параметры, каждый
 * проверяется отдельно: битый `categoryId` не сбрасывает фильтр по типу.
 * `pageSize` из URL не берётся, размер страницы задаёт приложение.
 */
export function normalizeTransactionsSearch(
  raw: RawSearchParams,
): TransactionsSearch {
  const search: TransactionsSearch = {};
  for (const key of SEARCH_KEYS) {
    const value = raw[key];
    // Повторяющийся параметр (`?page=1&page=2`) сводим к первому значению.
    const first = Array.isArray(value) ? value[0] : value;
    if (
      first !== undefined &&
      listTransactionsQuerySchema.shape[key].safeParse(first).success
    ) {
      search[key] = first;
    }
  }
  // Первая страница — адрес без `page`.
  if (search.page && Number(search.page) === 1) delete search.page;
  return search;
}

/** Запрос к api по проверенным параметрам URL. */
export function toTransactionsQuery(
  search: TransactionsSearch,
): ListTransactionsQuery {
  return listTransactionsQuerySchema.parse({
    ...search,
    pageSize: TRANSACTIONS_PAGE_SIZE,
  });
}

/** Адрес страницы транзакций с теми же фильтрами. */
export function transactionsHref(
  search: TransactionsSearch,
  page?: number,
): string {
  const params = new URLSearchParams(search);
  if (page !== undefined) {
    if (page > 1) params.set('page', String(page));
    else params.delete('page');
  }
  const query = params.toString();
  return query ? `/transactions?${query}` : '/transactions';
}

/** Совпадают ли наборы параметров без учёта порядка. */
export function isSameSearch(
  raw: RawSearchParams,
  search: TransactionsSearch,
): boolean {
  const keys = Object.keys(raw);
  return (
    keys.length === Object.keys(search).length &&
    keys.every((key) => raw[key] === search[key as keyof TransactionsSearch])
  );
}
