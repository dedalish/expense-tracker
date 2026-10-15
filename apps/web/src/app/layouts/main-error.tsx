'use client';

import { useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

/** Ошибка страницы (api недоступен и т. п.). Меню остаётся на месте. */
export function MainError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Не удалось загрузить данные</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm text-muted-foreground">
        <p>Сервис временно недоступен. Попробуйте ещё раз через минуту.</p>
        <Button className="self-start" onClick={retry}>
          Повторить
        </Button>
      </CardContent>
    </Card>
  );
}
