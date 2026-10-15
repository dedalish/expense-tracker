'use client';

import '@/shared/config/zod';
import {
  type Category,
  type CreateCategoryInput,
  createCategorySchema,
} from '@expense-tracker/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ReactElement, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { applyActionError } from '@/shared/lib/action-error';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { FormError } from '@/shared/ui/form-error';
import { Input } from '@/shared/ui/input';
import { TextField } from '@/shared/ui/text-field';
import { createCategoryAction, updateCategoryAction } from '../api/actions';
import { DEFAULT_COLOR, ICON_PRESETS } from '../config/presets';

interface CategoryFormDialogProps {
  trigger: ReactElement;
  /** Есть — редактирование, нет — создание. */
  category?: Category;
}

type FormInput = z.input<typeof createCategorySchema>;

export function CategoryFormDialog({
  trigger,
  category,
}: CategoryFormDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? 'Изменить категорию' : 'Новая категория'}
          </DialogTitle>
        </DialogHeader>
        <CategoryForm category={category} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({
  category,
  onDone,
}: {
  category?: Category;
  onDone: () => void;
}) {
  // Форма монтируется при каждом открытии диалога: после «Отмены»
  // несохранённые правки не остаются, а значения берутся из свежих props.
  const form = useForm<FormInput, unknown, CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: category?.name ?? '',
      color: category?.color ?? DEFAULT_COLOR,
      icon: category?.icon ?? ICON_PRESETS[0],
    },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    const error = category
      ? await updateCategoryAction(category.id, values)
      : await createCategoryAction(values);
    if (error) {
      applyActionError(form.setError, error);
      return;
    }
    onDone();
    toast.success(category ? 'Категория изменена' : 'Категория создана');
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormError message={errors.root?.server?.message} />
        <TextField
          control={form.control}
          name="name"
          label="Название"
          placeholder="Продукты"
        />
        <Controller
          control={form.control}
          name="icon"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Иконка</FieldLabel>
              <div className="flex flex-wrap gap-1">
                {ICON_PRESETS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    aria-label={`Иконка ${icon}`}
                    aria-pressed={field.value === icon}
                    onClick={() => field.onChange(icon)}
                    className={cn(
                      'flex size-9 items-center justify-center rounded-md border text-lg transition-colors hover:bg-muted',
                      field.value === icon &&
                        'border-primary bg-muted ring-2 ring-primary/30',
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <Input
                {...field}
                id={field.name}
                placeholder="Или свой emoji"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="color"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Цвет</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="color"
                className="h-9 w-20 cursor-pointer p-1"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Сохраняем…' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
}
