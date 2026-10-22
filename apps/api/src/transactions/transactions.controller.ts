import {
  type CreateTransactionInput,
  createTransactionSchema,
  type ListTransactionsQuery,
  listTransactionsQuerySchema,
  type Transaction,
  type TransactionPage,
  type TransactionSummary,
  type TransactionSummaryQuery,
  transactionSummaryQuerySchema,
  type UpdateTransactionInput,
  updateTransactionSchema,
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
  Query,
} from '@nestjs/common';
import { z } from 'zod';
import type { JwtPayload } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { TransactionsService } from './transactions.service.js';

/** Проверяет, что `:id` в пути — UUID; иначе 400 до обращения к БД. */
const idPipe = new ZodValidationPipe(z.uuid());

/**
 * REST-роуты транзакций `/api/transactions`.
 *
 * Все роуты защищены глобальным `AuthGuard`: без валидного Bearer-токена
 * запрос получает `UnauthorizedException` (401) раньше, чем дойдёт
 * до контроллера. Каждый роут работает только с транзакциями текущего
 * пользователя (`user.sub`).
 */
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  /**
   * `POST /transactions` — создаёт транзакцию.
   *
   * @param user Текущий пользователь из токена.
   * @param body Тело запроса по `createTransactionSchema`.
   * @returns Созданная транзакция.
   * @throws {BadRequestException} 400 — тело не прошло схему или категория
   *   не найдена у пользователя.
   */
  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createTransactionSchema))
    body: CreateTransactionInput,
  ): Promise<Transaction> {
    return this.transactions.create(user.sub, body);
  }

  /**
   * `GET /transactions` — страница транзакций с фильтрами.
   *
   * @param user Текущий пользователь из токена.
   * @param query Фильтры `dateFrom`, `dateTo`, `type`, `categoryId` и
   *   пагинация `page`, `pageSize` по `listTransactionsQuerySchema`.
   * @returns `{ items, total, page, pageSize }`; страница за пределами
   *   данных даёт пустой `items`.
   * @throws {BadRequestException} 400 — параметры не прошли схему
   *   (например, `pageSize` больше 100).
   */
  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(listTransactionsQuerySchema))
    query: ListTransactionsQuery,
  ): Promise<TransactionPage> {
    return this.transactions.findAll(user.sub, query);
  }

  /**
   * `GET /transactions/summary` — сводка доходов и расходов за месяц.
   *
   * Объявлен раньше `:id`, иначе `summary` попал бы в параметр id.
   *
   * @param user Текущий пользователь из токена.
   * @param query `month` (1–12) и `year` по `transactionSummaryQuerySchema`.
   * @returns Суммы дохода, расхода, баланс и разбивка по категориям.
   * @throws {BadRequestException} 400 — `month` или `year` не прошли схему.
   */
  @Get('summary')
  summary(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(transactionSummaryQuerySchema))
    query: TransactionSummaryQuery,
  ): Promise<TransactionSummary> {
    return this.transactions.summary(user.sub, query);
  }

  /**
   * `GET /transactions/:id` — одна транзакция.
   *
   * @param user Текущий пользователь из токена.
   * @param id UUID транзакции.
   * @returns Найденная транзакция.
   * @throws {BadRequestException} 400 — `id` не UUID.
   * @throws {NotFoundException} 404 — транзакции нет или она чужая.
   */
  @Get(':id')
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', idPipe) id: string,
  ): Promise<Transaction> {
    return this.transactions.findOne(user.sub, id);
  }

  /**
   * `PATCH /transactions/:id` — частичное изменение транзакции.
   *
   * @param user Текущий пользователь из токена.
   * @param id UUID транзакции.
   * @param body Изменяемые поля по `updateTransactionSchema`.
   * @returns Транзакция после изменения.
   * @throws {BadRequestException} 400 — `id` не UUID, тело не прошло схему
   *   или новая категория не найдена у пользователя.
   * @throws {NotFoundException} 404 — транзакции нет или она чужая.
   */
  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', idPipe) id: string,
    @Body(new ZodValidationPipe(updateTransactionSchema))
    body: UpdateTransactionInput,
  ): Promise<Transaction> {
    return this.transactions.update(user.sub, id, body);
  }

  /**
   * `DELETE /transactions/:id` — удаляет транзакцию, ответ 204 без тела.
   *
   * @param user Текущий пользователь из токена.
   * @param id UUID транзакции.
   * @throws {BadRequestException} 400 — `id` не UUID.
   * @throws {NotFoundException} 404 — транзакции нет или она чужая.
   */
  @HttpCode(204)
  @Delete(':id')
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', idPipe) id: string,
  ): Promise<void> {
    return this.transactions.remove(user.sub, id);
  }
}
