import 'server-only';
import { cookies } from 'next/headers';
import { SESSION_COOKIE } from '@/shared/config/session';
import { getTokenExpiry } from '@/shared/lib/jwt';

/** Кладёт access-токен в httpOnly cookie: JS в браузере его не видит. */
export async function setSessionCookie(token: string): Promise<void> {
  const expiry = getTokenExpiry(token);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // Cookie живёт столько же, сколько токен.
    expires: expiry ?? undefined,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
