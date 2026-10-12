import type { FieldErrors } from '@/shared/api/client';

/** Ошибка Server Action: общая (над формой) и/или по полям. */
export interface AuthActionError {
  message?: string;
  fieldErrors?: FieldErrors;
}
