'use server';

import {
  authResponseSchema,
  type LoginInput,
  loginSchema,
  type RegisterInput,
  registerSchema,
} from '@expense-tracker/shared';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { ApiError, apiFetch } from '@/shared/api/client';
import { clearSessionCookie, setSessionCookie } from '../model/session';
import type { AuthActionError } from '../model/types';

const SERVICE_UNAVAILABLE = 'Сервис недоступен, попробуйте позже';

export async function loginAction(input: LoginInput): Promise<AuthActionError> {
  return authenticate('/auth/login', loginSchema, input);
}

export async function registerAction(
  input: RegisterInput,
): Promise<AuthActionError> {
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
): Promise<AuthActionError> {
  // Server Action можно вызвать в обход формы, поэтому проверяем ещё раз.
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
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

function toActionError(error: unknown): AuthActionError {
  if (!(error instanceof ApiError) || error.status >= 500) {
    console.error(error);
    return { message: SERVICE_UNAVAILABLE };
  }
  // 400: ошибки по полям, общий текст «Validation failed» не показываем.
  if (Object.keys(error.fieldErrors).length > 0) {
    return { fieldErrors: error.fieldErrors };
  }
  // 401 и 409: api уже отдаёт текст на русском.
  return { message: error.message };
}
