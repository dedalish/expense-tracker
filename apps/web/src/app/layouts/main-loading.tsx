import { Skeleton } from '@/shared/ui/skeleton';

/** Скелетон страницы, пока сервер получает данные из api. */
export function MainLoading() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Загрузка">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
