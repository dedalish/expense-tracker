import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@expense-tracker/shared';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { hasPrismaCode, PrismaErrorCode } from '../common/prisma-errors.js';
import { GetUserByIdQuery } from '../users/queries/get-user-by-id.query.js';
import { CategoriesRepository } from './categories.repository.js';
import { toCategoryResponse } from './category.mapper.js';

const DUPLICATE_NAME = 'Категория с таким названием уже есть';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categories: CategoriesRepository,
    private readonly queryBus: QueryBus,
  ) {}

  async create(userId: string, input: CreateCategoryInput): Promise<Category> {
    // Токен валиден, но пользователя уже нет: без проверки получили бы ошибку FK.
    const user = await this.queryBus.execute(new GetUserByIdQuery(userId));
    if (!user) {
      throw new UnauthorizedException();
    }

    try {
      return toCategoryResponse(await this.categories.create(userId, input));
    } catch (error) {
      if (hasPrismaCode(error, PrismaErrorCode.UniqueViolation)) {
        throw new ConflictException(DUPLICATE_NAME);
      }
      throw error;
    }
  }

  async findAll(userId: string): Promise<Category[]> {
    const categories = await this.categories.findAllByUser(userId);
    return categories.map(toCategoryResponse);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateCategoryInput,
  ): Promise<Category> {
    try {
      return toCategoryResponse(
        await this.categories.update({ id, userId }, input),
      );
    } catch (error) {
      if (hasPrismaCode(error, PrismaErrorCode.UniqueViolation)) {
        throw new ConflictException(DUPLICATE_NAME);
      }
      if (hasPrismaCode(error, PrismaErrorCode.RecordNotFound)) {
        throw new NotFoundException('Категория не найдена');
      }
      throw error;
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    try {
      await this.categories.delete({ id, userId });
    } catch (error) {
      if (hasPrismaCode(error, PrismaErrorCode.RecordNotFound)) {
        throw new NotFoundException('Категория не найдена');
      }
      // Transaction → Category с onDelete: NoAction.
      if (hasPrismaCode(error, PrismaErrorCode.ForeignKeyViolation)) {
        throw new ConflictException('В категории есть транзакции');
      }
      throw error;
    }
  }
}
