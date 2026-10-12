import { z } from 'zod';

const categoryNameSchema = z.string().trim().min(1).max(50);

/** Hex-цвет `#rrggbb`. Приводится к нижнему регистру: `#FF8800` и `#ff8800` один цвет. */
const categoryColorSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.string().regex(/^#[0-9a-f]{6}$/, 'Ожидается цвет в формате #rrggbb'));

/** Emoji или имя иконки. */
const categoryIconSchema = z.string().trim().min(1).max(32);

export const createCategorySchema = z.object({
  name: categoryNameSchema,
  color: categoryColorSchema,
  icon: categoryIconSchema,
});

export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Нужно передать хотя бы одно поле',
  });

/** Категория в ответах API: без `userId`. */
export const categorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  color: z.string(),
  icon: z.string(),
  createdAt: z.iso.datetime(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type Category = z.infer<typeof categorySchema>;
