export type PageItem = number | 'ellipsis';

/**
 * Номера страниц для пагинации: первая, последняя, текущая ±1,
 * пропуски — многоточием. Одиночный пропуск заменяется самим номером.
 */
export function getPageItems(current: number, pageCount: number): PageItem[] {
  const pages = new Set([1, pageCount, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= pageCount)
    .toSorted((a, b) => a - b);

  const items: PageItem[] = [];
  for (const page of sorted) {
    const previous = items.at(-1);
    if (typeof previous === 'number' && page - previous === 2) {
      items.push(previous + 1);
    } else if (typeof previous === 'number' && page - previous > 2) {
      items.push('ellipsis');
    }
    items.push(page);
  }
  return items;
}
