import { TRANSACTIONS_PAGE_SIZE } from '@expense-tracker/shared';
import { describe, expect, it } from 'vitest';
import {
  isSameSearch,
  normalizeTransactionsSearch,
  toTransactionsQuery,
  transactionsHref,
} from './search-params';

const categoryId = '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5c';

describe('normalizeTransactionsSearch', () => {
  it('оставляет корректные фильтры и страницу', () => {
    expect(
      normalizeTransactionsSearch({ type: 'INCOME', categoryId, page: '3' }),
    ).toEqual({ type: 'INCOME', categoryId, page: '3' });
  });

  it('битый параметр отбрасывается отдельно, остальные остаются', () => {
    expect(
      normalizeTransactionsSearch({ type: 'INCOME', categoryId: 'abc' }),
    ).toEqual({ type: 'INCOME' });
  });

  it('не берёт из URL pageSize, даты и неизвестные параметры', () => {
    expect(
      normalizeTransactionsSearch({
        pageSize: '100',
        dateFrom: '2026-10-01',
        foo: 'bar',
        page: '2',
      }),
    ).toEqual({ page: '2' });
  });

  it.each(['1', '01'])('первая страница (%s) — адрес без page', (page) => {
    expect(normalizeTransactionsSearch({ page })).toEqual({});
  });

  it.each(['0', '-1', '1.5', 'abc', ''])('отклоняет page=%j', (page) => {
    expect(normalizeTransactionsSearch({ page })).toEqual({});
  });

  it('из повторяющегося параметра берёт первое значение', () => {
    expect(normalizeTransactionsSearch({ page: ['2', '5'] })).toEqual({
      page: '2',
    });
  });
});

describe('toTransactionsQuery', () => {
  it('без параметров — первая страница стандартного размера', () => {
    expect(toTransactionsQuery({})).toEqual({
      page: 1,
      pageSize: TRANSACTIONS_PAGE_SIZE,
    });
  });

  it('приводит page к числу и передаёт фильтры', () => {
    expect(
      toTransactionsQuery({ type: 'EXPENSE', categoryId, page: '4' }),
    ).toEqual({
      type: 'EXPENSE',
      categoryId,
      page: 4,
      pageSize: TRANSACTIONS_PAGE_SIZE,
    });
  });
});

describe('transactionsHref', () => {
  it('без параметров — путь без query', () => {
    expect(transactionsHref({})).toBe('/transactions');
  });

  it('сохраняет фильтры при смене страницы', () => {
    expect(transactionsHref({ type: 'INCOME', page: '2' }, 3)).toBe(
      '/transactions?type=INCOME&page=3',
    );
  });

  it('первая страница убирает page из адреса', () => {
    expect(transactionsHref({ type: 'INCOME', page: '2' }, 1)).toBe(
      '/transactions?type=INCOME',
    );
  });

  it('без номера страницы оставляет текущую', () => {
    expect(transactionsHref({ page: '2' })).toBe('/transactions?page=2');
  });
});

describe('isSameSearch', () => {
  it('одинаковые параметры в другом порядке совпадают', () => {
    expect(
      isSameSearch(
        { page: '2', type: 'INCOME' },
        { type: 'INCOME', page: '2' },
      ),
    ).toBe(true);
  });

  it('лишний параметр в URL — не совпадают', () => {
    expect(
      isSameSearch({ type: 'INCOME', foo: 'bar' }, { type: 'INCOME' }),
    ).toBe(false);
  });

  it('повторяющийся параметр — не совпадают, адрес нужно почистить', () => {
    expect(isSameSearch({ page: ['2', '5'] }, { page: '2' })).toBe(false);
  });
});
