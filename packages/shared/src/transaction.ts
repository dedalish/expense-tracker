import { z } from 'zod';

export const transactionTypeSchema = z.enum(['INCOME', 'EXPENSE']);

/**
 * Сумма приходит числом или строкой, дальше живёт строкой (`"1250.50"`):
 * так Decimal(12, 2) из БД не теряет точность во float. Всегда > 0, знак задаёт type.
 */
const amountSchema = z
  .union([z.number(), z.string()])
  .transform((value) => String(value).trim())
  .pipe(
    z
      .string()
      .regex(
        /^\d{1,10}(\.\d{1,2})?$/,
        'Ожидается сумма вида 1250.50: до 10 цифр и до 2 знаков после точки',
      ),
  )
  .refine((value) => Number(value) > 0, 'Сумма должна быть больше нуля');

/** Дата без времени `YYYY-MM-DD`. */
const dateSchema = z.iso.date();

/** Пустая строка превращается в null: описания нет. */
const descriptionSchema = z
  .string()
  .trim()
  .max(500)
  .transform((value) => value || null)
  .nullish();

export const createTransactionSchema = z.object({
  amount: amountSchema,
  type: transactionTypeSchema,
  date: dateSchema,
  categoryId: z.uuid(),
  description: descriptionSchema,
});

export const updateTransactionSchema = createTransactionSchema
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Нужно передать хотя бы одно поле',
  });

/** Размер страницы списка транзакций по умолчанию. */
export const TRANSACTIONS_PAGE_SIZE = 10;

/**
 * Фильтры и страница списка; границы дат включительно.
 * Query-параметры приходят строками, поэтому page и pageSize через coerce.
 */
export const listTransactionsQuerySchema = z
  .object({
    dateFrom: dateSchema.optional(),
    dateTo: dateSchema.optional(),
    type: transactionTypeSchema.optional(),
    categoryId: z.uuid().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(TRANSACTIONS_PAGE_SIZE),
  })
  .refine(
    // Строки YYYY-MM-DD сравниваются лексикографически так же, как даты.
    ({ dateFrom, dateTo }) => !dateFrom || !dateTo || dateFrom <= dateTo,
    { message: 'dateFrom не может быть позже dateTo', path: ['dateTo'] },
  );

/** Query-параметры приходят строками, поэтому coerce. */
export const transactionSummaryQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

/** Транзакция в ответах API: без `userId`. */
export const transactionSchema = z.object({
  id: z.uuid(),
  amount: z.string(),
  type: transactionTypeSchema,
  description: z.string().nullable(),
  date: z.iso.date(),
  categoryId: z.uuid(),
  createdAt: z.iso.datetime(),
});

/** Страница списка: `total` — число транзакций по фильтрам без учёта страниц. */
export const transactionPageSchema = z.object({
  items: z.array(transactionSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

export const transactionSummarySchema = z.object({
  month: z.number().int(),
  year: z.number().int(),
  income: z.string(),
  expense: z.string(),
  /** income − expense, может быть отрицательным. */
  balance: z.string(),
  /** Итоги по паре категория + тип, по убыванию суммы. */
  byCategory: z.array(
    z.object({
      categoryId: z.uuid(),
      name: z.string(),
      color: z.string(),
      icon: z.string(),
      type: transactionTypeSchema,
      total: z.string(),
      count: z.number().int(),
    }),
  ),
});

export type TransactionType = z.infer<typeof transactionTypeSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
export type ListTransactionsQueryInput = z.input<
  typeof listTransactionsQuerySchema
>;
export type TransactionSummaryQuery = z.infer<
  typeof transactionSummaryQuerySchema
>;
export type Transaction = z.infer<typeof transactionSchema>;
export type TransactionPage = z.infer<typeof transactionPageSchema>;
export type TransactionSummary = z.infer<typeof transactionSummarySchema>;
