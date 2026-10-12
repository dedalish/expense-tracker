import { type NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/shared/config/session';
import { getTokenExpiry } from '@/shared/lib/jwt';

/** Страницы только для гостей; всё остальное требует сессии. */
const GUEST_ONLY_PATHS = ['/login', '/register'];
/** Страницы, открытые и гостям, и вошедшим. */
const PUBLIC_PATHS = ['/privacy'];

/**
 * Редиректы по cookie сессии. Подпись токена здесь не проверяется:
 * это только UX, доступ к данным проверяет api.
 */
export function proxy(request: NextRequest) {
  if (PUBLIC_PATHS.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const expiry = token ? getTokenExpiry(token) : null;
  const hasSession = expiry !== null && expiry > Date.now();
  const isGuestOnly = GUEST_ONLY_PATHS.includes(request.nextUrl.pathname);

  if (!hasSession && !isGuestOnly) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (hasSession && isGuestOnly) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Статика Next, файлы с расширением и /logout идут мимо proxy.
  matcher: ['/((?!_next/static|_next/image|logout|.*\\.\\w+$).*)'],
};
