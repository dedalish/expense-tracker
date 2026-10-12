import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { Category } from '../../generated/prisma/client.js';
import { CategoriesRepository } from '../categories.repository.js';
import { GetCategoryQuery } from './get-category.query.js';

@QueryHandler(GetCategoryQuery)
export class GetCategoryHandler implements IQueryHandler<GetCategoryQuery> {
  constructor(private readonly categories: CategoriesRepository) {}

  execute({ key }: GetCategoryQuery): Promise<Category | null> {
    return this.categories.findOne(key);
  }
}
