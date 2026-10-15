'use client';

import '@/shared/config/zod';
import { type LoginInput, loginSchema } from '@expense-tracker/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '@/shared/ui/button';
import { FieldGroup } from '@/shared/ui/field';
import { loginAction } from '../api/actions';
import { applyActionError } from '@/shared/lib/action-error';
import { FormError } from '@/shared/ui/form-error';
import { TextField } from '@/shared/ui/text-field';

export function LoginForm() {
  const form = useForm<z.input<typeof loginSchema>, unknown, LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    applyActionError(form.setError, await loginAction(values));
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormError message={errors.root?.server?.message} />
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
          autoComplete="current-password"
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Входим…' : 'Войти'}
        </Button>
      </FieldGroup>
    </form>
  );
}
