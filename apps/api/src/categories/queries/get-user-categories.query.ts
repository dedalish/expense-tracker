import { Query } from '@nestjs/cqrs';
import type { Category } from '../../generated/prisma/client.js';

export class GetUserCategoriesQuery extends Query<Category[]> {
  constructor(public readonly userId: string) {
    super();
  }
}
