'use client';

import type { HTMLInputTypeAttribute } from 'react';
import {
  type Control,
  Controller,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';

interface TextFieldProps<TIn extends FieldValues, TOut> {
  control: Control<TIn, unknown, TOut>;
  name: Path<TIn>;
  label: string;
  type?: HTMLInputTypeAttribute;
  autoComplete?: string;
}

/** Текстовое поле формы: shadcn Field + Controller из react-hook-form. */
export function TextField<TIn extends FieldValues, TOut>({
  control,
  name,
  label,
  type = 'text',
  autoComplete,
}: TextFieldProps<TIn, TOut>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <Input
            {...field}
            id={field.name}
            type={type}
            autoComplete={autoComplete}
            aria-invalid={fieldState.invalid}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
