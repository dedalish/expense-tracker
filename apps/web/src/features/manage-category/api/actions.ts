'use server';

import {
  type CreateCategoryInput,
  categorySchema,
  createCategorySchema,
  type UpdateCategoryInput,
  updateCategorySchema,
} from '@expense-tracker/shared';
import { z } from 'zod';
import {
  runMutation,
  toValidationError,
  validateId,
} from '@/shared/api/action-error';
import { authedFetch } from '@/shared/api/session';
import type { ActionError } from '@/shared/lib/action-error';

export async function createCategoryAction(
  input: CreateCategoryInput,
): Promise<ActionError | undefined> {
  // Server Action можно вызвать в обход формы, поэтому проверяем ещё раз.
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) return toValidationError(parsed.error);

  return runMutation(() =>
    authedFetch('/categories', categorySchema, {
      method: 'POST',
      body: parsed.data,
    }),
  );
}

export async function updateCategoryAction(
  id: string,
  input: UpdateCategoryInput,
): Promise<ActionError | undefined> {
  const invalidId = validateId(id);
  if (invalidId) return invalidId;
  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) return toValidationError(parsed.error);

  return runMutation(() =>
    authedFetch(`/categories/${encodeURIComponent(id)}`, categorySchema, {
      method: 'PATCH',
      body: parsed.data,
    }),
  );
}

/** Категорию с транзакциями api не удалит: ответ 409 с текстом причины. */
export async function deleteCategoryAction(
  id: string,
): Promise<ActionError | undefined> {
  const invalidId = validateId(id);
  if (invalidId) return invalidId;

  return runMutation(() =>
    // 204 без тела: apiFetch получит null.
    authedFetch(`/categories/${encodeURIComponent(id)}`, z.null(), {
      method: 'DELETE',
    }),
  );
}
