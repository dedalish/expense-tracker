import { describe, expect, it } from 'vitest';
import {
  currentMonth,
  isSameMonth,
  parseMonthParam,
  recentMonths,
  shiftMonth,
  toMonthParam,
  validTimeZone,
} from './month';

describe('parseMonthParam', () => {
  it('разбирает YYYY-MM', () => {
    expect(parseMonthParam('2026-10')).toEqual({ year: 2026, month: 10 });
  });

  it.each([
    '2026-13',
    '2026-00',
    '1999-12',
    '2026-1',
    '10-2026',
    '',
    undefined,
    ['2026-10'],
  ])('отклоняет %j', (value) => {
    expect(parseMonthParam(value)).toBeNull();
  });
});

describe('toMonthParam', () => {
  it('дополняет месяц нулём', () => {
    expect(toMonthParam({ year: 2026, month: 3 })).toBe('2026-03');
  });
});

describe('currentMonth', () => {
  // 31 октября, 22:00 UTC: в Москве (+3) уже 1 ноября.
  const now = new Date('2026-10-31T22:00:00Z');

  it('считает месяц в часовом поясе пользователя', () => {
    expect(currentMonth('Europe/Moscow', now)).toEqual({
      year: 2026,
      month: 11,
    });
    expect(currentMonth('UTC', now)).toEqual({ year: 2026, month: 10 });
  });

  it('переходит через год', () => {
    expect(
      currentMonth('Asia/Tokyo', new Date('2026-12-31T20:00:00Z')),
    ).toEqual({ year: 2027, month: 1 });
  });
});

describe('shiftMonth', () => {
  it.each([
    [{ year: 2026, month: 10 }, -1, { year: 2026, month: 9 }],
    [{ year: 2026, month: 1 }, -1, { year: 2025, month: 12 }],
    [{ year: 2026, month: 12 }, 1, { year: 2027, month: 1 }],
    [{ year: 2026, month: 10 }, -22, { year: 2024, month: 12 }],
  ])('%j на %i → %j', (from, delta, expected) => {
    expect(shiftMonth(from, delta)).toEqual(expected);
  });
});

describe('recentMonths', () => {
  it('начинается с текущего и идёт назад через год', () => {
    expect(recentMonths({ year: 2026, month: 2 }, 3)).toEqual([
      { year: 2026, month: 2 },
      { year: 2026, month: 1 },
      { year: 2025, month: 12 },
    ]);
  });
});

describe('isSameMonth', () => {
  it('сравнивает год и месяц', () => {
    expect(
      isSameMonth({ year: 2026, month: 10 }, { year: 2026, month: 10 }),
    ).toBe(true);
    expect(
      isSameMonth({ year: 2026, month: 10 }, { year: 2025, month: 10 }),
    ).toBe(false);
  });
});

describe('validTimeZone', () => {
  it('пропускает существующий пояс', () => {
    expect(validTimeZone('Asia/Almaty')).toBe('Asia/Almaty');
  });

  it.each([undefined, '', 'Mars/Olympus', 'не пояс'])(
    'отклоняет %j',
    (value) => {
      expect(validTimeZone(value)).toBeUndefined();
    },
  );
});
