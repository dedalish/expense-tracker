'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { deleteTransactionAction } from '../api/actions';

export function DeleteTransactionButton({ id }: { id: string }) {
  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="icon-sm" aria-label="Удалить транзакцию">
          <Trash2 />
        </Button>
      }
      title="Удалить транзакцию?"
      description="Это действие нельзя отменить."
      confirmLabel="Удалить"
      successMessage="Транзакция удалена"
      onConfirm={() => deleteTransactionAction(id)}
    />
  );
}
