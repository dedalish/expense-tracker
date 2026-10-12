/**
 * Время истечения JWT (`exp`) в миллисекундах, без проверки подписи.
 * Подпись проверяет api; здесь срок нужен только для cookie и редиректов.
 */
export function getTokenExpiry(token: string): number | null {
  const payload = token.split('.')[1];
  if (!payload) return null;

  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json) as { exp?: unknown };
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}
