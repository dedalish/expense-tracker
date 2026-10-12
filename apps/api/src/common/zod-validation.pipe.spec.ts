import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe.js';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(
    z.object({ amount: z.number().positive() }),
  );

  it('возвращает данные, прошедшие проверку', () => {
    expect(pipe.transform({ amount: 100 })).toEqual({ amount: 100 });
  });

  it('бросает BadRequestException на невалидных данных', () => {
    expect(() => pipe.transform({ amount: -1 })).toThrow(BadRequestException);
  });
});
