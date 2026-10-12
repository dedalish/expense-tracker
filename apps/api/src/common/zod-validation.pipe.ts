import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { z } from 'zod';

/**
 * Проверяет входные данные по Zod-схеме (обычно из @expense-tracker/shared):
 * `@Body(new ZodValidationPipe(createExpenseSchema)) body: CreateExpense`
 */
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform {
  constructor(private readonly schema: T) {}

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
