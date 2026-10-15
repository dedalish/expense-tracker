import { transactionSummaryQuerySchema } from '@expense-tracker/shared';

/** Месяц 1–12 и год, как в запросе сводки к api. */
export interface YearMonth {
  year: number;
  month: number;
}

const MONTH_PARAM = /^(\d{4})-(\d{2})$/;

/** `?month=2026-10` → месяц или null, если строка некорректна. */
export function parseMonthParam(value: unknown): YearMonth | null {
  if (typeof value !== 'string') return null;
  const match = MONTH_PARAM.exec(value);
  if (!match) return null;
  // Те же границы года и месяца, что проверяет api.
  const parsed = transactionSummaryQuerySchema.safeParse({
    year: match[1],
    month: match[2],
  });
  return parsed.success ? parsed.data : null;
}

/** Месяц → значение параметра `2026-10`. */
export function toMonthParam({ year, month }: YearMonth): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Текущий месяц в часовом поясе пользователя. */
export function currentMonth(timeZone?: string, now = new Date()): YearMonth {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(now);
  const get = (type: 'year' | 'month') =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: get('year'), month: get('month') };
}

/** Сдвиг на `delta` месяцев с переходом через год. */
export function shiftMonth(
  { year, month }: YearMonth,
  delta: number,
): YearMonth {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** `count` месяцев от `from` назад, начиная с него самого. */
export function recentMonths(from: YearMonth, count: number): YearMonth[] {
  return Array.from({ length: count }, (_, i) => shiftMonth(from, -i));
}

export function isSameMonth(a: YearMonth, b: YearMonth): boolean {
  return a.year === b.year && a.month === b.month;
}

/** Строка из cookie — существующий IANA-пояс, иначе undefined. */
export function validTimeZone(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return value;
  } catch {
    return undefined;
  }
}
