import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { Category } from '../../generated/prisma/client.js';
import { CategoriesRepository } from '../categories.repository.js';
import { GetCategoryQuery } from './get-category.query.js';

/** Выполняет {@link GetCategoryQuery} через `CategoriesRepository`. */
@QueryHandler(GetCategoryQuery)
export class GetCategoryHandler implements IQueryHandler<GetCategoryQuery> {
  constructor(private readonly categories: CategoriesRepository) {}

  /**
   * Ищет категорию по паре `id` + `userId`.
   *
   * @param query Запрос с ключом категории.
   * @returns Категория или `null`, если её нет или она чужая. Исключений
   *   не бросает, кроме ошибок подключения к БД.
   */
  execute({ key }: GetCategoryQuery): Promise<Category | null> {
    return this.categories.findOne(key);
  }
}
