'use client';

import type { Category } from '@expense-tracker/shared';
import { Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { deleteCategoryAction } from '../api/actions';

export function DeleteCategoryButton({ category }: { category: Category }) {
  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="icon-sm" aria-label="Удалить категорию">
          <Trash2 />
        </Button>
      }
      title={`Удалить категорию «${category.name}»?`}
      description="Категорию с транзакциями удалить нельзя: сначала удалите или перенесите их."
      confirmLabel="Удалить"
      successMessage="Категория удалена"
      onConfirm={() => deleteCategoryAction(category.id)}
    />
  );
}
