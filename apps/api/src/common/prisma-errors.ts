import { Prisma } from '../generated/prisma/client.js';

/** Коды ошибок Prisma, которые превращаются в HTTP-ответы. */
export const PrismaErrorCode = {
  UniqueViolation: 'P2002',
  ForeignKeyViolation: 'P2003',
  RecordNotFound: 'P2025',
} as const;

/**
 * Проверяет, что ошибка — известная ошибка запроса Prisma с данным кодом.
 *
 * @param error Пойманная ошибка любого типа.
 * @param code Код Prisma, обычно из {@link PrismaErrorCode}.
 * @returns `true`, если `error` — `PrismaClientKnownRequestError` с этим
 *   кодом. Исключений не бросает.
 */
export function hasPrismaCode(error: unknown, code: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}
