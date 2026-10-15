'use server';

import {
  publicUserSchema,
  type UpdateProfileInput,
  updateProfileSchema,
} from '@expense-tracker/shared';
import { runMutation, toValidationError } from '@/shared/api/action-error';
import { authedFetch } from '@/shared/api/session';
import type { ActionError } from '@/shared/lib/action-error';

export async function updateProfileAction(
  input: UpdateProfileInput,
): Promise<ActionError | undefined> {
  // Server Action можно вызвать в обход формы, поэтому проверяем ещё раз.
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) return toValidationError(parsed.error);

  return runMutation(() =>
    authedFetch('/auth/me', publicUserSchema, {
      method: 'PATCH',
      body: parsed.data,
    }),
  );
}
