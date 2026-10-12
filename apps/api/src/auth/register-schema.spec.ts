import { registerSchema } from '@expense-tracker/shared';
import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';

describe('registerSchema: согласие на обработку персональных данных', () => {
  const pipe = new ZodValidationPipe(registerSchema);
  const body = {
    name: 'Иван',
    email: 'ivan@example.com',
    password: 'password123',
  };

  it('пропускает регистрацию с согласием', () => {
    expect(pipe.transform({ ...body, personalDataConsent: true })).toEqual({
      ...body,
      personalDataConsent: true,
    });
  });

  it.each([false, undefined])(
    'отклоняет регистрацию без согласия (%s)',
    (personalDataConsent) => {
      expect(() => pipe.transform({ ...body, personalDataConsent })).toThrow(
        BadRequestException,
      );
    },
  );
});
