import { Query } from '@nestjs/cqrs';
import type { Category } from '../../generated/prisma/client.js';
import type { CategoryKey } from '../categories.repository.js';

/**
 * Запрос категории пользователя для других модулей (через `QueryBus`).
 * Результат — категория или `null`, если её нет или она чужая.
 */
export class GetCategoryQuery extends Query<Category | null> {
  /** @param key Id категории и id владельца. */
  constructor(public readonly key: CategoryKey) {
    super();
  }
}
