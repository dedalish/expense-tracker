import { describe, expect, it } from 'vitest';
import { getPageItems } from './page-numbers';

describe('getPageItems', () => {
  it.each([
    [1, 1, [1]],
    [1, 3, [1, 2, 3]],
    [2, 3, [1, 2, 3]],
  ])(
    'страница %i из %i: все номера без многоточий',
    (current, count, expected) => {
      expect(getPageItems(current, count)).toEqual(expected);
    },
  );

  it('в начале списка: соседняя страница и многоточие до последней', () => {
    expect(getPageItems(1, 10)).toEqual([1, 2, 'ellipsis', 10]);
  });

  it('в конце списка: многоточие после первой и соседняя страница', () => {
    expect(getPageItems(10, 10)).toEqual([1, 'ellipsis', 9, 10]);
  });

  it('в середине: первая, текущая ±1, последняя и два многоточия', () => {
    expect(getPageItems(5, 10)).toEqual([
      1,
      'ellipsis',
      4,
      5,
      6,
      'ellipsis',
      10,
    ]);
  });

  it('пропуск в одну страницу заменяется её номером, а не многоточием', () => {
    expect(getPageItems(4, 10)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 10]);
    expect(getPageItems(7, 10)).toEqual([1, 'ellipsis', 6, 7, 8, 9, 10]);
  });

  it('номера идут по возрастанию без повторов', () => {
    for (let count = 1; count <= 12; count++) {
      for (let current = 1; current <= count; current++) {
        const pages = getPageItems(current, count).filter(
          (item) => item !== 'ellipsis',
        );
        expect(pages).toEqual([...new Set(pages)].toSorted((a, b) => a - b));
        expect(pages).toContain(current);
        expect(pages[0]).toBe(1);
        expect(pages.at(-1)).toBe(count);
      }
    }
  });
});
