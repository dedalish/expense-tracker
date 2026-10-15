import { redirect } from 'next/navigation';
import { clearSessionCookie } from '@/shared/api/session';

/**
 * Сброс сессии, которую api не принял (пользователь удалён, сменился секрет).
 * Server Component не может менять cookie, поэтому он перенаправляет сюда.
 */
export async function GET() {
  await clearSessionCookie();
  redirect('/login');
}
