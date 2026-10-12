import type { Category } from '@expense-tracker/shared';
import type { Category as CategoryEntity } from '../generated/prisma/client.js';

/** Категория для ответа API: без `userId`. */
export function toCategoryResponse(category: CategoryEntity): Category {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
    icon: category.icon,
    createdAt: category.createdAt.toISOString(),
  };
}
