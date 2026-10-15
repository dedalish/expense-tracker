'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { TIME_ZONE_COOKIE } from '@/shared/config/time-zone';

const YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Сообщает серверу часовой пояс браузера через cookie: сервер сам его
 * не знает, а от пояса зависит «текущий месяц». Если пояс изменился
 * (первый заход, переезд), страница перерисовывается с новым значением.
 */
export function TimeZoneSync() {
  const router = useRouter();

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const current = document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith(`${TIME_ZONE_COOKIE}=`))
      ?.slice(TIME_ZONE_COOKIE.length + 1);
    if (current === encodeURIComponent(timeZone)) return;

    document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(timeZone)}; path=/; max-age=${YEAR_SECONDS}; samesite=lax`;
    router.refresh();
  }, [router]);

  return null;
}
