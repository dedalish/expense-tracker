import 'server-only';
import { publicUserSchema, type PublicUser } from '@expense-tracker/shared';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { ApiError, apiFetch } from '@/shared/api/client';
import { SESSION_COOKIE } from '@/shared/config/session';

/**
 * Текущий пользователь по cookie сессии или null, если токена нет
 * или api его не принял. В пределах одного запроса вызывается один раз.
 */
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    return await apiFetch('/auth/me', publicUserSchema, { token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});
