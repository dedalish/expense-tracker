import 'server-only';
import { z } from 'zod';
import { API_URL } from '@/shared/config/env';

/** Тело ошибки NestJS. У ошибок `ZodValidationPipe` есть ещё `errors`. */
const apiErrorBodySchema = z.object({
  message: z.union([z.string(), z.array(z.string())]),
  errors: z
    .object({
      fieldErrors: z.record(z.string(), z.array(z.string()).optional()),
    })
    .optional(),
});

export type FieldErrors = Record<string, string[] | undefined>;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors: FieldErrors = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Access-токен для заголовка `Authorization: Bearer`. */
  token?: string;
}

/**
 * Запрос к api с сервера Next. Ответ разбирается схемой из shared,
 * ошибка HTTP превращается в `ApiError`.
 */
export async function apiFetch<T extends z.ZodType>(
  path: string,
  schema: T,
  { method = 'GET', body, token }: ApiFetchOptions = {},
): Promise<z.output<T>> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = apiErrorBodySchema.safeParse(data);
    if (!error.success)
      throw new ApiError(response.status, response.statusText);

    const { message, errors } = error.data;
    throw new ApiError(
      response.status,
      [message].flat().join('; '),
      errors?.fieldErrors,
    );
  }

  return schema.parse(data);
}
