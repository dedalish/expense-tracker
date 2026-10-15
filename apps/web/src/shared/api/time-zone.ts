import 'server-only';
import { cookies } from 'next/headers';
import { TIME_ZONE_COOKIE } from '@/shared/config/time-zone';
import { validTimeZone } from '@/shared/lib/month';

/**
 * Часовой пояс браузера из cookie. Пока cookie нет (первый заход)
 * или в ней мусор, undefined: тогда считается в поясе сервера.
 */
export async function getUserTimeZone(): Promise<string | undefined> {
  return validTimeZone((await cookies()).get(TIME_ZONE_COOKIE)?.value);
}
