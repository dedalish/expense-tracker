import {
  createTransactionSchema,
  listTransactionsQuerySchema,
  transactionSummaryQuerySchema,
  updateTransactionSchema,
} from '@expense-tracker/shared';
import { describe, expect, it } from 'vitest';

const categoryId = '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5c';
const valid = {
  amount: '1250.50',
  type: 'EXPENSE',
  date: '2026-10-12',
  categoryId,
};

describe('createTransactionSchema', () => {
  it.each([
    [1250.5, '1250.5'],
    ['1250.50', '1250.50'],
    [' 42 ', '42'],
  ])('принимает сумму %j и хранит её строкой', (amount, expected) => {
    expect(createTransactionSchema.parse({ ...valid, amount }).amount).toBe(
      expected,
    );
  });

  it.each([0, '0.00', -5, '1.234', 'abc', '12345678901'])(
    'отклоняет сумму %j',
    (amount) => {
      expect(
        createTransactionSchema.safeParse({ ...valid, amount }).success,
      ).toBe(false);
    },
  );

  it.each(['2026-13-01', '12.10.2026', '2026-10-12T10:00:00Z'])(
    'отклоняет дату %s',
    (date) => {
      expect(
        createTransactionSchema.safeParse({ ...valid, date }).success,
      ).toBe(false);
    },
  );

  it('превращает пустое описание в null', () => {
    expect(
      createTransactionSchema.parse({ ...valid, description: '   ' })
        .description,
    ).toBeNull();
  });

  it('отклоняет неизвестный тип', () => {
    expect(
      createTransactionSchema.safeParse({ ...valid, type: 'TRANSFER' }).success,
    ).toBe(false);
  });
});

describe('updateTransactionSchema', () => {
  it('принимает частичное обновление', () => {
    expect(updateTransactionSchema.parse({ amount: 10 })).toEqual({
      amount: '10',
    });
  });

  it('отклоняет пустой объект', () => {
    expect(updateTransactionSchema.safeParse({}).success).toBe(false);
  });
});

describe('listTransactionsQuerySchema', () => {
  it('принимает пустые фильтры', () => {
    expect(listTransactionsQuerySchema.parse({})).toEqual({});
  });

  it('отклоняет dateFrom позже dateTo', () => {
    expect(
      listTransactionsQuerySchema.safeParse({
        dateFrom: '2026-10-31',
        dateTo: '2026-10-01',
      }).success,
    ).toBe(false);
  });
});

describe('transactionSummaryQuerySchema', () => {
  it('приводит строки query к числам', () => {
    expect(
      transactionSummaryQuerySchema.parse({ month: '10', year: '2026' }),
    ).toEqual({ month: 10, year: 2026 });
  });

  it.each([
    { month: '13', year: '2026' },
    { month: '0', year: '2026' },
    { month: '10' },
    { year: '2026' },
  ])('отклоняет %j', (query) => {
    expect(transactionSummaryQuerySchema.safeParse(query).success).toBe(false);
  });
});
