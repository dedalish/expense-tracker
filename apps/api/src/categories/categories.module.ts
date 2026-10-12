import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller.js';
import { CategoriesRepository } from './categories.repository.js';
import { CategoriesService } from './categories.service.js';
import { GetCategoryHandler } from './queries/get-category.handler.js';
import { GetUserCategoriesHandler } from './queries/get-user-categories.handler.js';

/**
 * С пользователями работает только через QueryBus, UsersModule не импортирует.
 * Другим модулям категории отдаются через запросы из `queries/`.
 */
@Module({
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    CategoriesRepository,
    GetCategoryHandler,
    GetUserCategoriesHandler,
  ],
})
export class CategoriesModule {}
