import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { z } from 'zod';

/**
 * Проверяет входные данные по Zod-схеме (обычно из @expense-tracker/shared):
 * `@Body(new ZodValidationPipe(createTransactionSchema)) body: CreateTransactionInput`
 */
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform {
  /** @param schema Схема, которой должны соответствовать данные. */
  constructor(private readonly schema: T) {}

  /**
   * Разбирает значение схемой.
   *
   * @param value Тело, query или параметр запроса.
   * @returns Данные после схемы: с трансформациями и значениями
   *   по умолчанию (например, `page` = 1).
   * @throws {BadRequestException} 400 с телом
   *   `{ message: 'Validation failed', errors }`, где `errors` — результат
   *   `z.flattenError` (`formErrors` и `fieldErrors`).
   */
  transform(value: unknown): z.output<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: z.flattenError(result.error),
      });
    }
    return result.data;
  }
}
