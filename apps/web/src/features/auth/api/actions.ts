'use server';

import {
  authResponseSchema,
  type LoginInput,
  loginSchema,
  type RegisterInput,
  registerSchema,
} from '@expense-tracker/shared';
import { redirect } from 'next/navigation';
import { toActionError, toValidationError } from '@/shared/api/action-error';
import { apiFetch } from '@/shared/api/client';
import { clearSessionCookie } from '@/shared/api/session';
import type { ActionError } from '@/shared/lib/action-error';
import { setSessionCookie } from '../model/session';

export async function loginAction(input: LoginInput): Promise<ActionError> {
  return authenticate('/auth/login', loginSchema, input);
}

export async function registerAction(
  input: RegisterInput,
): Promise<ActionError> {
  return authenticate('/auth/register', registerSchema, input);
}

export async function logoutAction(): Promise<never> {
  // Токен stateless: на стороне api завершать нечего.
  await clearSessionCookie();
  redirect('/login');
}

/** При успехе ставит cookie и уводит на главную, иначе возвращает ошибку. */
async function authenticate(
  path: string,
  schema: typeof loginSchema | typeof registerSchema,
  input: unknown,
): Promise<ActionError> {
  // Server Action можно вызвать в обход формы, поэтому проверяем ещё раз.
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return toValidationError(parsed.error);
  }

  try {
    const { accessToken } = await apiFetch(path, authResponseSchema, {
      method: 'POST',
      body: parsed.data,
    });
    await setSessionCookie(accessToken);
  } catch (error) {
    return toActionError(error);
  }

  // redirect бросает исключение, поэтому он вне try.
  redirect('/');
}
