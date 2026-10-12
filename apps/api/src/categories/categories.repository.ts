import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@expense-tracker/shared';
import { Injectable } from '@nestjs/common';
import type { Category } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** Категория, принадлежащая конкретному пользователю. */
export interface CategoryKey {
  id: string;
  userId: string;
}

/**
 * Единственное место, где код обращается к `prisma.category`.
 * `update` и `delete` ищут по паре `id` + `userId`: чужая категория
 * для Prisma не найдена (P2025).
 */
@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, data: CreateCategoryInput): Promise<Category> {
    return this.prisma.category.create({ data: { ...data, userId } });
  }

  findAllByUser(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  findOne(key: CategoryKey): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: key });
  }

  update(key: CategoryKey, data: UpdateCategoryInput): Promise<Category> {
    return this.prisma.category.update({ where: key, data });
  }

  delete(key: CategoryKey): Promise<Category> {
    return this.prisma.category.delete({ where: key });
  }
}
