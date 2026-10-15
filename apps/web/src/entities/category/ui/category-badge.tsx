import type { Category } from '@expense-tracker/shared';
import { cn } from '@/shared/lib/utils';

interface CategoryBadgeProps {
  category: Pick<Category, 'name' | 'color' | 'icon'>;
  className?: string;
}

/** Иконка категории на фоне её цвета и название. */
export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2', className)}>
      <CategoryIcon category={category} />
      <span className="truncate">{category.name}</span>
    </span>
  );
}

export function CategoryIcon({ category, className }: CategoryBadgeProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-full text-sm',
        className,
      )}
      // Цвет приходит из данных, классом Tailwind его не задать. 33 — прозрачность 20 %.
      style={{ backgroundColor: `${category.color}33` }}
    >
      {category.icon}
    </span>
  );
}
