'use client';

import '@/shared/config/zod';
import {
  type UpdateProfileInput,
  updateProfileSchema,
} from '@expense-tracker/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { applyActionError } from '@/shared/lib/action-error';
import { Button } from '@/shared/ui/button';
import { FieldGroup } from '@/shared/ui/field';
import { FormError } from '@/shared/ui/form-error';
import { TextField } from '@/shared/ui/text-field';
import { updateProfileAction } from '../api/actions';

export function ProfileNameForm({ name }: { name: string }) {
  const form = useForm<
    z.input<typeof updateProfileSchema>,
    unknown,
    UpdateProfileInput
  >({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name },
  });
  const { errors, isSubmitting, isDirty } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    const error = await updateProfileAction(values);
    if (error) {
      applyActionError(form.setError, error);
      return;
    }
    // Новое имя становится исходным: кнопка снова неактивна.
    form.reset(values);
    toast.success('Имя сохранено');
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
        <Button
          type="submit"
          className="self-start"
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting ? 'Сохраняем…' : 'Сохранить'}
        </Button>
      </FieldGroup>
    </form>
  );
}
