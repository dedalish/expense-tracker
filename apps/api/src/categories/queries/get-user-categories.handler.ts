import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { Category } from '../../generated/prisma/client.js';
import { CategoriesRepository } from '../categories.repository.js';
import { GetUserCategoriesQuery } from './get-user-categories.query.js';

/** Выполняет {@link GetUserCategoriesQuery} через `CategoriesRepository`. */
@QueryHandler(GetUserCategoriesQuery)
export class GetUserCategoriesHandler implements IQueryHandler<GetUserCategoriesQuery> {
  constructor(private readonly categories: CategoriesRepository) {}

  /**
   * Все категории пользователя.
   *
   * @param query Запрос с id владельца.
   * @returns Категории по названию; пустой список, если их нет. Исключений
   *   не бросает, кроме ошибок подключения к БД.
   */
  execute({ userId }: GetUserCategoriesQuery): Promise<Category[]> {
    return this.categories.findAllByUser(userId);
  }
}
