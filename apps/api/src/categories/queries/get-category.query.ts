import { Query } from '@nestjs/cqrs';
import type { Category } from '../../generated/prisma/client.js';
import type { CategoryKey } from '../categories.repository.js';

/** Категория пользователя или null, если её нет или она чужая. */
export class GetCategoryQuery extends Query<Category | null> {
  constructor(public readonly key: CategoryKey) {
    super();
  }
}
