import 'server-only';
// Русские тексты ошибок Zod нужны и при повторной проверке в Server Action.
import '@/shared/config/zod';
import { refresh } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';
import type { ActionError } from '@/shared/lib/action-error';
import { ApiError } from './client';

const SERVICE_UNAVAILABLE = 'Сервис недоступен, попробуйте позже';

const NOT_FOUND = 'Запись не найдена';

/**
 * id из аргументов Server Action: действие можно вызвать в обход UI,
 * а строка попадает в путь запроса к api. Не uuid → ошибка.
 */
export function validateId(id: unknown): ActionError | undefined {
  return z.uuid().safeParse(id).success ? undefined : { message: NOT_FOUND };
}

/** Ошибка проверки входных данных Server Action. */
export function toValidationError(error: z.ZodError): ActionError {
  return { fieldErrors: z.flattenError(error).fieldErrors };
}

/** Ошибка запроса к api → ошибка Server Action для формы. */
export function toActionError(error: unknown): ActionError {
  // redirect('/logout') из authedFetch тоже исключение: его пропускаем дальше.
  unstable_rethrow(error);
  if (!(error instanceof ApiError) || error.status >= 500) {
    console.error(error);
    return { message: SERVICE_UNAVAILABLE };
  }
  // 400: ошибки по полям, общий текст «Validation failed» не показываем.
  if (Object.keys(error.fieldErrors).length > 0) {
    return { fieldErrors: error.fieldErrors };
  }
  // 401, 404 и 409: api уже отдаёт текст на русском.
  return { message: error.message };
}

/**
 * Изменение данных в api из Server Action. При успехе обновляет
 * Server Components на клиенте и возвращает undefined, иначе ошибку для формы.
 */
export async function runMutation(
  request: () => Promise<unknown>,
): Promise<ActionError | undefined> {
  try {
    await request();
  } catch (error) {
    return toActionError(error);
  }
  refresh();
  return undefined;
}
