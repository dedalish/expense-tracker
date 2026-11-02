import { Skeleton } from '@/shared/ui/skeleton';

/** Скелетон страницы, пока сервер получает данные из api. */
export function MainLoading() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Загрузка">
      <div className="grid gap-2">
        <Skeleton className="h-10 w-72 rounded-full bg-card/70" />
        <Skeleton className="h-5 w-96 max-w-full rounded-full bg-card/70" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-24 rounded-2xl bg-card/70" />
        <Skeleton className="h-24 rounded-2xl bg-card/70" />
        <Skeleton className="h-24 rounded-2xl bg-card/70" />
      </div>
      <Skeleton className="h-72 rounded-2xl bg-card/70" />
    </div>
  );
}
