import {
  type Category,
  type CreateCategoryInput,
  createCategorySchema,
  type UpdateCategoryInput,
  updateCategorySchema,
} from '@expense-tracker/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { z } from 'zod';
import type { JwtPayload } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { CategoriesService } from './categories.service.js';

const idPipe = new ZodValidationPipe(z.uuid());

/** Все роуты защищены глобальным AuthGuard. */
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createCategorySchema))
    body: CreateCategoryInput,
  ): Promise<Category> {
    return this.categories.create(user.sub, body);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload): Promise<Category[]> {
    return this.categories.findAll(user.sub);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', idPipe) id: string,
    @Body(new ZodValidationPipe(updateCategorySchema))
    body: UpdateCategoryInput,
  ): Promise<Category> {
    return this.categories.update(user.sub, id, body);
  }

  @HttpCode(204)
  @Delete(':id')
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', idPipe) id: string,
  ): Promise<void> {
    return this.categories.remove(user.sub, id);
  }
}
