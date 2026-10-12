'use client';

import type { RegisterInput, registerSchema } from '@expense-tracker/shared';
import Link from 'next/link';
import { type Control, Controller } from 'react-hook-form';
import type { z } from 'zod';
import { Checkbox } from '@/shared/ui/checkbox';
import { Field, FieldContent, FieldError, FieldLabel } from '@/shared/ui/field';

interface ConsentFieldProps {
  control: Control<z.input<typeof registerSchema>, unknown, RegisterInput>;
}

/** Обязательное согласие на обработку персональных данных (152-ФЗ). */
export function ConsentField({ control }: ConsentFieldProps) {
  return (
    <Controller
      control={control}
      name="personalDataConsent"
      render={({ field, fieldState }) => (
        <Field orientation="horizontal" data-invalid={fieldState.invalid}>
          <Checkbox
            id={field.name}
            name={field.name}
            checked={field.value}
            onCheckedChange={(checked) => field.onChange(checked)}
            onBlur={field.onBlur}
            inputRef={field.ref}
            aria-invalid={fieldState.invalid}
          />
          <FieldContent>
            <FieldLabel htmlFor={field.name} className="block font-normal">
              Я даю согласие на обработку персональных данных в соответствии с{' '}
              <Link
                href="/privacy"
                target="_blank"
                className="text-foreground underline"
              >
                политикой обработки персональных данных
              </Link>
            </FieldLabel>
            <FieldError errors={[fieldState.error]} />
          </FieldContent>
        </Field>
      )}
    />
  );
}
