import { z } from 'zod';

/**
 * Тело стандартной ошибки Nest (`HttpException`). Для Swagger: схемы ответов
 * с ошибками в `@ApiResponse({ standardSchema })`.
 *
 * `error` есть, только если исключению передали сообщение: например,
 * `new NotFoundException('Транзакция не найдена')`. У `UnauthorizedException()`
 * без аргументов тело `{ message: 'Unauthorized', statusCode: 401 }`.
 */
export const httpErrorSchema = z.object({
  statusCode: z.number().int(),
  message: z.string(),
  error: z.string().optional(),
});

/** Тело 400 от `ZodValidationPipe`: ошибки в формате `z.flattenError`. */
export const validationErrorSchema = z.object({
  message: z.literal('Validation failed'),
  errors: z.object({
    formErrors: z.array(z.string()),
    fieldErrors: z.record(z.string(), z.array(z.string())),
  }),
});

/** 400, когда роут проверяет и схему, и данные в сервисе. */
export const badRequestSchema = z.union([
  validationErrorSchema,
  httpErrorSchema,
]);
