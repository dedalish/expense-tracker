'use client';

import '@/shared/config/zod';
import {
  type Category,
  type CreateTransactionInput,
  createTransactionSchema,
  type Transaction,
  type TransactionType,
} from '@expense-tracker/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { type ReactElement, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';
import { applyActionError } from '@/shared/lib/action-error';
import { today } from '@/shared/lib/format';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field';
import { FormError } from '@/shared/ui/form-error';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { TextField } from '@/shared/ui/text-field';
import {
  createTransactionAction,
  updateTransactionAction,
} from '../api/actions';

interface TransactionFormDialogProps {
  trigger: ReactElement;
  categories: Category[];
  /** Есть — редактирование, нет — создание. */
  transaction?: Transaction;
}

type FormInput = z.input<typeof createTransactionSchema>;

const TYPE_LABELS: Record<TransactionType, string> = {
  EXPENSE: 'Расход',
  INCOME: 'Доход',
};

export function TransactionFormDialog({
  trigger,
  categories,
  transaction,
}: TransactionFormDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Изменить транзакцию' : 'Новая транзакция'}
          </DialogTitle>
          {categories.length === 0 && (
            <DialogDescription>
              Транзакция относится к категории, а у вас их пока нет.{' '}
              <Link
                href="/categories"
                className="text-foreground underline"
                onClick={() => setOpen(false)}
              >
                Создайте категорию
              </Link>
              , затем возвращайтесь.
            </DialogDescription>
          )}
        </DialogHeader>
        {categories.length > 0 && (
          <TransactionForm
            categories={categories}
            transaction={transaction}
            onDone={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TransactionForm({
  categories,
  transaction,
  onDone,
}: {
  categories: Category[];
  transaction?: Transaction;
  onDone: () => void;
}) {
  // Форма монтируется при каждом открытии диалога, поэтому значения свежие.
  const form = useForm<FormInput, unknown, CreateTransactionInput>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      type: transaction?.type ?? 'EXPENSE',
      amount: transaction?.amount ?? '',
      date: transaction?.date ?? today(),
      categoryId: transaction?.categoryId ?? '',
      description: transaction?.description ?? '',
    },
  });
  const { errors, isSubmitting } = form.formState;
  const categoryItems = categories.map((category) => ({
    value: category.id,
    label: `${category.icon} ${category.name}`,
  }));

  const onSubmit = form.handleSubmit(async (values) => {
    const error = transaction
      ? await updateTransactionAction(transaction.id, values)
      : await createTransactionAction(values);
    if (error) {
      applyActionError(form.setError, error);
      return;
    }
    onDone();
    toast.success(transaction ? 'Транзакция изменена' : 'Транзакция добавлена');
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormError message={errors.root?.server?.message} />
        <Controller
          control={form.control}
          name="type"
          render={({ field }) => (
            <div
              role="radiogroup"
              aria-label="Тип"
              className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
            >
              {(['EXPENSE', 'INCOME'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={field.value === type}
                  onClick={() => field.onChange(type)}
                  className={cn(
                    'rounded-md py-1.5 text-sm font-medium text-muted-foreground transition-colors',
                    field.value === type &&
                      'bg-background text-foreground shadow-sm',
                  )}
                >
                  {TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField
            control={form.control}
            name="amount"
            label="Сумма, ₽"
            inputMode="decimal"
            placeholder="1250.50"
          />
          <TextField
            control={form.control}
            name="date"
            label="Дата"
            type="date"
          />
        </div>
        <Controller
          control={form.control}
          name="categoryId"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Категория</FieldLabel>
              <Select
                items={categoryItems}
                value={field.value || null}
                onValueChange={(value) => field.onChange(value ?? '')}
              >
                <SelectTrigger
                  id={field.name}
                  className="w-full"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categoryItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Описание</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ''}
                id={field.name}
                placeholder="Необязательно"
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
