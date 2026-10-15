import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/shared/ui/pagination';
import { getPageItems } from '../lib/page-numbers';
import {
  type TransactionsSearch,
  transactionsHref,
} from '../lib/search-params';

interface TransactionsPaginationProps {
  page: number;
  pageCount: number;
  /** Текущие фильтры: сохраняются при смене страницы. */
  search: TransactionsSearch;
}

/**
 * Пагинация ссылками `?page=N`. Ссылки через next/link, а не `<a>` из
 * PaginationLink shadcn: так переход идёт без полной перезагрузки.
 */
export function TransactionsPagination({
  page,
  pageCount,
  search,
}: TransactionsPaginationProps) {
  if (pageCount <= 1) return null;

  const href = (target: number) => transactionsHref(search, target);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PageButton href={href(page - 1)} disabled={page <= 1}>
            <ChevronLeft />
            <span className="hidden sm:inline">Назад</span>
          </PageButton>
        </PaginationItem>
        {getPageItems(page, pageCount).map((item, index) => (
          <PaginationItem key={item === 'ellipsis' ? `e${index}` : item}>
            {item === 'ellipsis' ? (
              <PaginationEllipsis />
            ) : (
              <Button
                variant={item === page ? 'outline' : 'ghost'}
                size="icon"
                nativeButton={false}
                render={
                  <Link
                    href={href(item)}
                    aria-current={item === page ? 'page' : undefined}
                    aria-label={`Страница ${item}`}
                  />
                }
              >
                {item}
              </Button>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PageButton href={href(page + 1)} disabled={page >= pageCount}>
            <span className="hidden sm:inline">Вперёд</span>
            <ChevronRight />
          </PageButton>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function PageButton({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <Button variant="ghost" disabled>
        {children}
      </Button>
    );
  }
  return (
    <Button variant="ghost" nativeButton={false} render={<Link href={href} />}>
      {children}
    </Button>
  );
}
