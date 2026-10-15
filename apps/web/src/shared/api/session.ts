import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { z } from 'zod';
import { SESSION_COOKIE } from '@/shared/config/session';
import { ApiError, type ApiFetchOptions, apiFetch } from './client';

/** Access-токен из httpOnly cookie сессии. */
export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * Запрос к api от имени текущего пользователя. Если api токен не принял,
 * уводит на `/logout`: там cookie сбрасывается.
 */
export async function authedFetch<T extends z.ZodType>(
  path: string,
  schema: T,
  options: Omit<ApiFetchOptions, 'token'> = {},
): Promise<z.output<T>> {
  const token = await getSessionToken();
  if (!token) redirect('/logout');

  try {
    return await apiFetch(path, schema, { ...options, token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect('/logout');
    throw error;
  }
}
