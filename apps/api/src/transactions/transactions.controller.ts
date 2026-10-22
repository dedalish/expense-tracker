import {
  type CreateTransactionInput,
  createTransactionSchema,
  type ListTransactionsQuery,
  listTransactionsQuerySchema,
  type Transaction,
  type TransactionPage,
  transactionPageSchema,
  transactionSchema,
  type TransactionSummary,
  type TransactionSummaryQuery,
  transactionSummaryQuerySchema,
  transactionSummarySchema,
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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { z } from 'zod';
import type { JwtPayload } from '../auth/auth.types.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import {
  badRequestSchema,
  httpErrorSchema,
  validationErrorSchema,
} from '../common/api-error.schemas.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { TransactionsService } from './transactions.service.js';

/** Проверяет, что `:id` в пути — UUID; иначе 400 до обращения к БД. */
const idSchema = z.uuid();
const idPipe = new ZodValidationPipe(idSchema);

// Схема в опциях параметра нужна Swagger, проверку делает пайп.
const idParam = { schema: idSchema, pipes: [idPipe] };

const NOT_FOUND = 'Транзакции нет или она принадлежит другому пользователю';

/**
 * REST-роуты транзакций `/api/transactions`.
 *
 * Все роуты защищены глобальным `AuthGuard`: без валидного Bearer-токена
 * запрос получает `UnauthorizedException` (401) раньше, чем дойдёт
 * до контроллера. Каждый роут работает только с транзакциями текущего
 * пользователя (`user.sub`).
 */
@ApiTags('Transactions')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Нет Bearer-токена, токен невалиден или истёк',
  standardSchema: httpErrorSchema,
})
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
  @ApiOperation({
    summary: 'Создать транзакцию',
    description:
      'Сумма передаётся числом или строкой, в ответе всегда строка вида `"1250.50"`. Категория должна принадлежать пользователю.',
  })
  @ApiCreatedResponse({
    description: 'Созданная транзакция',
    standardSchema: transactionSchema,
  })
  @ApiBadRequestResponse({
    description: 'Тело не прошло схему или категория не найдена у пользователя',
    standardSchema: badRequestSchema,
  })
  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body({
      schema: createTransactionSchema,
      pipes: [new ZodValidationPipe(createTransactionSchema)],
    })
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
  @ApiOperation({
    summary: 'Список транзакций',
    description:
      'Постраничный список с фильтрами; границы `dateFrom` и `dateTo` включительно. Сортировка: дата, затем id по убыванию. Страница за пределами данных даёт пустой `items`.',
  })
  @ApiOkResponse({
    description: 'Страница транзакций',
    standardSchema: transactionPageSchema,
  })
  @ApiBadRequestResponse({
    description:
      'Параметры не прошли схему (например, `pageSize` больше 100 или `dateFrom` позже `dateTo`)',
    standardSchema: validationErrorSchema,
  })
  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query({
      schema: listTransactionsQuerySchema,
      pipes: [new ZodValidationPipe(listTransactionsQuerySchema)],
    })
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
  @ApiOperation({
    summary: 'Сводка за месяц',
    description:
      'Доход, расход, баланс и суммы по категориям за календарный месяц (UTC). Суммы — строки с двумя знаками после точки, баланс может быть отрицательным.',
  })
  @ApiOkResponse({
    description: 'Сводка за месяц',
    standardSchema: transactionSummarySchema,
  })
  @ApiBadRequestResponse({
    description: '`month` или `year` не прошли схему',
    standardSchema: validationErrorSchema,
  })
  @Get('summary')
  summary(
    @CurrentUser() user: JwtPayload,
    @Query({
      schema: transactionSummaryQuerySchema,
      pipes: [new ZodValidationPipe(transactionSummaryQuerySchema)],
    })
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
  @ApiOperation({ summary: 'Получить транзакцию' })
  @ApiOkResponse({
    description: 'Найденная транзакция',
    standardSchema: transactionSchema,
  })
  @ApiBadRequestResponse({
    description: '`id` не UUID',
    standardSchema: validationErrorSchema,
  })
  @ApiNotFoundResponse({
    description: NOT_FOUND,
    standardSchema: httpErrorSchema,
  })
  @Get(':id')
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', idParam) id: string,
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
  @ApiOperation({
    summary: 'Изменить транзакцию',
    description:
      'Частичное изменение: передаются только изменяемые поля, хотя бы одно. Новая категория должна принадлежать пользователю.',
  })
  @ApiOkResponse({
    description: 'Транзакция после изменения',
    standardSchema: transactionSchema,
  })
  @ApiBadRequestResponse({
    description:
      '`id` не UUID, тело не прошло схему или новая категория не найдена у пользователя',
    standardSchema: badRequestSchema,
  })
  @ApiNotFoundResponse({
    description: NOT_FOUND,
    standardSchema: httpErrorSchema,
  })
  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', idParam) id: string,
    @Body({
      schema: updateTransactionSchema,
      pipes: [new ZodValidationPipe(updateTransactionSchema)],
    })
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
  @ApiOperation({ summary: 'Удалить транзакцию' })
  @ApiNoContentResponse({ description: 'Транзакция удалена, тела нет' })
  @ApiBadRequestResponse({
    description: '`id` не UUID',
    standardSchema: validationErrorSchema,
  })
  @ApiNotFoundResponse({
    description: NOT_FOUND,
    standardSchema: httpErrorSchema,
  })
  @HttpCode(204)
  @Delete(':id')
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', idParam) id: string,
  ): Promise<void> {
    return this.transactions.remove(user.sub, id);
  }
}
