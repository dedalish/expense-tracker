const moneyFormat = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
});

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const monthFormat = new Intl.DateTimeFormat('ru-RU', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * Сумма из api (`"1250.50"`) для показа. Number здесь только ради
 * форматирования: считает деньги api в Decimal.
 */
export function formatMoney(amount: string): string {
  return moneyFormat.format(Number(amount));
}

/** `YYYY-MM-DD` → «12 окт. 2026 г.». Дата без времени, поэтому UTC. */
export function formatDate(date: string): string {
  return dateFormat.format(new Date(`${date}T00:00:00Z`));
}

/** ISO-время → дата без времени. */
export function formatDateTime(value: string): string {
  return dateFormat.format(new Date(value));
}

/** Месяц и год: «октябрь 2026 г.». */
export function formatMonth(month: number, year: number): string {
  return monthFormat.format(new Date(Date.UTC(year, month - 1, 1)));
}

/** Сегодняшняя дата `YYYY-MM-DD` в часовом поясе пользователя. */
export function today(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}
