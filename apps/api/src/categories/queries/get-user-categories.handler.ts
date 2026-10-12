import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { Category } from '../../generated/prisma/client.js';
import { CategoriesRepository } from '../categories.repository.js';
import { GetUserCategoriesQuery } from './get-user-categories.query.js';

@QueryHandler(GetUserCategoriesQuery)
export class GetUserCategoriesHandler implements IQueryHandler<GetUserCategoriesQuery> {
  constructor(private readonly categories: CategoriesRepository) {}

  execute({ userId }: GetUserCategoriesQuery): Promise<Category[]> {
    return this.categories.findAllByUser(userId);
  }
}
