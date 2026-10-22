import { Query } from '@nestjs/cqrs';
import type { Category } from '../../generated/prisma/client.js';

/**
 * Запрос всех категорий пользователя для других модулей (через `QueryBus`).
 * Результат — список по названию, пустой, если категорий нет.
 */
export class GetUserCategoriesQuery extends Query<Category[]> {
  /** @param userId Id владельца. */
  constructor(public readonly userId: string) {
    super();
  }
}
