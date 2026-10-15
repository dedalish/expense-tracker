import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCategories } from '@/entities/category';
import { getTransactions } from '@/entities/transaction';
import { TransactionFormDialog } from '@/features/manage-transaction';
import {
  isSameSearch,
  normalizeTransactionsSearch,
  toTransactionsQuery,
  TransactionsFilters,
  TransactionsList,
  TransactionsPagination,
  transactionsHref,
} from '@/widgets/transactions-list';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { PageHeader } from '@/shared/ui/page-header';

export const metadata: Metadata = { title: 'Транзакции · Expense Tracker' };

export async function TransactionsPage({
  searchParams,
}: PageProps<'/transactions'>) {
  const raw = await searchParams;
  const search = normalizeTransactionsSearch(raw);
  // Лишние и битые параметры убираем из адреса: фильтры в интерфейсе
  // всегда совпадают с тем, что показано.
  if (!isSameSearch(raw, search)) redirect(transactionsHref(search));

  const query = toTransactionsQuery(search);
  const [page, categories] = await Promise.all([
    getTransactions(query),
    getCategories(),
  ]);
  const pageCount = Math.max(1, Math.ceil(page.total / page.pageSize));

  // Страница за пределами списка (например, после удаления) → последняя.
  if (query.page > pageCount) redirect(transactionsHref(search, pageCount));

  const hasFilters = Boolean(query.type ?? query.categoryId);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Транзакции"
        description={`Всего: ${page.total}`}
        actions={
          <TransactionFormDialog
            categories={categories}
            trigger={
              <Button>
                <Plus />
                Добавить
              </Button>
            }
          />
        }
      />

      <TransactionsFilters categories={categories} />

      <Card>
        <CardContent>
          <TransactionsList
            transactions={page.items}
            categories={categories}
            emptyText={
              hasFilters
                ? 'По этим фильтрам транзакций нет.'
                : 'Транзакций пока нет. Добавьте первую.'
            }
          />
        </CardContent>
      </Card>

      <TransactionsPagination
        page={query.page}
        pageCount={pageCount}
        search={search}
      />
    </div>
  );
}
