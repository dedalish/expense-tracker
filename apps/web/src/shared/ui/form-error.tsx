import { CircleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/ui/alert';

/** Общая ошибка формы (ответ api), показывается над полями. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
