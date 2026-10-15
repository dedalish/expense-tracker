import 'server-only';
import { publicUserSchema, type PublicUser } from '@expense-tracker/shared';
import { cache } from 'react';
import { ApiError, apiFetch } from '@/shared/api/client';
import { getSessionToken } from '@/shared/api/session';

/**
 * Текущий пользователь по cookie сессии или null, если токена нет
 * или api его не принял. В пределах одного запроса вызывается один раз.
 */
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    return await apiFetch('/auth/me', publicUserSchema, { token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});
