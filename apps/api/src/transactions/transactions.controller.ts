import {
  type CreateTransactionInput,
  createTransactionSchema,
  type ListTransactionsQuery,
  listTransactionsQuerySchema,
  type Transaction,
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

const idPipe = new ZodValidationPipe(z.uuid());

/** Все роуты защищены глобальным AuthGuard. */
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createTransactionSchema))
    body: CreateTransactionInput,
  ): Promise<Transaction> {
    return this.transactions.create(user.sub, body);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(listTransactionsQuerySchema))
    query: ListTransactionsQuery,
  ): Promise<Transaction[]> {
    return this.transactions.findAll(user.sub, query);
  }

  // Объявлен раньше `:id`, иначе `summary` попал бы в параметр id.
  @Get('summary')
  summary(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(transactionSummaryQuerySchema))
    query: TransactionSummaryQuery,
  ): Promise<TransactionSummary> {
    return this.transactions.summary(user.sub, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', idPipe) id: string,
  ): Promise<Transaction> {
    return this.transactions.findOne(user.sub, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', idPipe) id: string,
    @Body(new ZodValidationPipe(updateTransactionSchema))
    body: UpdateTransactionInput,
  ): Promise<Transaction> {
    return this.transactions.update(user.sub, id, body);
  }

  @HttpCode(204)
  @Delete(':id')
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', idPipe) id: string,
  ): Promise<void> {
    return this.transactions.remove(user.sub, id);
  }
}
