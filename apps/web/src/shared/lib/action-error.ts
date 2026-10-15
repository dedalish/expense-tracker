import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import type { FieldErrors } from '@/shared/api/client';

/** Ошибка Server Action: общая (над формой) и/или по полям. */
export interface ActionError {
  message?: string;
  fieldErrors?: FieldErrors;
}

/** Переносит ошибку Server Action в состояние react-hook-form. */
export function applyActionError<T extends FieldValues>(
  setError: UseFormSetError<T>,
  error: ActionError | undefined,
): void {
  for (const [name, messages] of Object.entries(error?.fieldErrors ?? {})) {
    const message = messages?.[0];
    if (message) setError(name as Path<T>, { message });
  }
  if (error?.message) {
    setError('root.server', { message: error.message });
  }
}
