import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@expense-tracker/shared';
import { Injectable } from '@nestjs/common';
import type { Category } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** Категория, принадлежащая конкретному пользователю. */
export interface CategoryKey {
  /** Id категории. */
  id: string;
  /** Id владельца. */
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

  /**
   * Создаёт категорию пользователя.
   *
   * @param userId Id владельца.
   * @param data Название, цвет и иконка по `createCategorySchema`.
   * @returns Созданная запись.
   * @throws {Prisma.PrismaClientKnownRequestError} P2002 — у пользователя
   *   уже есть категория с таким названием; P2003 — пользователя нет.
   */
  create(userId: string, data: CreateCategoryInput): Promise<Category> {
    return this.prisma.category.create({ data: { ...data, userId } });
  }

  /**
   * Все категории пользователя по названию (по возрастанию).
   *
   * @param userId Id владельца.
   * @returns Список категорий, пустой, если их нет.
   */
  findAllByUser(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Категория по паре `id` + `userId`.
   *
   * @param key Id категории и id владельца.
   * @returns Запись или `null`, если её нет или она чужая.
   */
  findOne(key: CategoryKey): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: key });
  }

  /**
   * Частично изменяет категорию по паре `id` + `userId`.
   *
   * @param key Id категории и id владельца.
   * @param data Изменяемые поля по `updateCategorySchema`.
   * @returns Запись после изменения.
   * @throws {Prisma.PrismaClientKnownRequestError} P2025 — категории нет
   *   или она чужая; P2002 — название уже занято у этого пользователя.
   */
  update(key: CategoryKey, data: UpdateCategoryInput): Promise<Category> {
    return this.prisma.category.update({ where: key, data });
  }

  /**
   * Удаляет категорию по паре `id` + `userId`.
   *
   * @param key Id категории и id владельца.
   * @returns Удалённая запись.
   * @throws {Prisma.PrismaClientKnownRequestError} P2025 — категории нет
   *   или она чужая; P2003 — в категории есть транзакции
   *   (`onDelete: NoAction`).
   */
  delete(key: CategoryKey): Promise<Category> {
    return this.prisma.category.delete({ where: key });
  }
}
