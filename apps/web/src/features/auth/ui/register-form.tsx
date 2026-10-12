'use client';

import '@/shared/config/zod';
import { type RegisterInput, registerSchema } from '@expense-tracker/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '@/shared/ui/button';
import { FieldGroup } from '@/shared/ui/field';
import { registerAction } from '../api/actions';
import { applyActionError } from '../lib/apply-action-error';
import { ConsentField } from './consent-field';
import { FormError } from './form-error';
import { TextField } from './text-field';

export function RegisterForm() {
  const form = useForm<z.input<typeof registerSchema>, unknown, RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      personalDataConsent: false,
    },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    applyActionError(form.setError, await registerAction(values));
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormError message={errors.root?.server?.message} />
        <TextField
          control={form.control}
          name="name"
          label="Имя"
          autoComplete="name"
        />
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
        />
        <TextField
          control={form.control}
          name="password"
          label="Пароль"
          type="password"
          autoComplete="new-password"
        />
        <ConsentField control={form.control} />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Создаём аккаунт…' : 'Зарегистрироваться'}
        </Button>
      </FieldGroup>
    </form>
  );
}
