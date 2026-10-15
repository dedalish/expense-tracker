'use server';

import {
  type CreateTransactionInput,
  createTransactionSchema,
  transactionSchema,
  type UpdateTransactionInput,
  updateTransactionSchema,
} from '@expense-tracker/shared';
import { z } from 'zod';
import {
  runMutation,
  toValidationError,
  validateId,
} from '@/shared/api/action-error';
import { authedFetch } from '@/shared/api/session';
import type { ActionError } from '@/shared/lib/action-error';

export async function createTransactionAction(
  input: CreateTransactionInput,
): Promise<ActionError | undefined> {
  // Server Action можно вызвать в обход формы, поэтому проверяем ещё раз.
  const parsed = createTransactionSchema.safeParse(input);
  if (!parsed.success) return toValidationError(parsed.error);

  return runMutation(() =>
    authedFetch('/transactions', transactionSchema, {
      method: 'POST',
      body: parsed.data,
    }),
  );
}

export async function updateTransactionAction(
  id: string,
  input: UpdateTransactionInput,
): Promise<ActionError | undefined> {
  const invalidId = validateId(id);
  if (invalidId) return invalidId;
  const parsed = updateTransactionSchema.safeParse(input);
  if (!parsed.success) return toValidationError(parsed.error);

  return runMutation(() =>
    authedFetch(`/transactions/${encodeURIComponent(id)}`, transactionSchema, {
      method: 'PATCH',
      body: parsed.data,
    }),
  );
}

export async function deleteTransactionAction(
  id: string,
): Promise<ActionError | undefined> {
  const invalidId = validateId(id);
  if (invalidId) return invalidId;

  return runMutation(() =>
    // 204 без тела: apiFetch получит null.
    authedFetch(`/transactions/${encodeURIComponent(id)}`, z.null(), {
      method: 'DELETE',
    }),
  );
}
