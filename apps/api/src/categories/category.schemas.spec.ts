import {
  createCategorySchema,
  updateCategorySchema,
} from '@expense-tracker/shared';
import { describe, expect, it } from 'vitest';

describe('createCategorySchema', () => {
  it('обрезает пробелы и приводит цвет к нижнему регистру', () => {
    expect(
      createCategorySchema.parse({
        name: '  Еда ',
        color: ' #FF8800 ',
        icon: '🍔',
      }),
    ).toEqual({ name: 'Еда', color: '#ff8800', icon: '🍔' });
  });

  it.each(['red', '#fff', '#ff88001', 'ff8800'])(
    'отклоняет цвет %s',
    (color) => {
      expect(
        createCategorySchema.safeParse({ name: 'Еда', color, icon: '🍔' })
          .success,
      ).toBe(false);
    },
  );

  it('отклоняет пустое название и иконку', () => {
    expect(
      createCategorySchema.safeParse({ name: ' ', color: '#ff8800', icon: '' })
        .success,
    ).toBe(false);
  });
});

describe('updateCategorySchema', () => {
  it('принимает частичное обновление', () => {
    expect(updateCategorySchema.parse({ icon: '🥗' })).toEqual({ icon: '🥗' });
  });

  it('отклоняет пустой объект', () => {
    expect(updateCategorySchema.safeParse({}).success).toBe(false);
  });
});
