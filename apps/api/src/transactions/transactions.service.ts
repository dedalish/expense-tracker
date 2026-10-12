import type {
  CreateTransactionInput,
  ListTransactionsQuery,
  Transaction,
  TransactionSummary,
  TransactionSummaryQuery,
  UpdateTransactionInput,
} from '@expense-tracker/shared';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetCategoryQuery } from '../categories/queries/get-category.query.js';
import { GetUserCategoriesQuery } from '../categories/queries/get-user-categories.query.js';
import { hasPrismaCode, PrismaErrorCode } from '../common/prisma-errors.js';
import { Prisma } from '../generated/prisma/client.js';
import { toDbDate, toTransactionResponse } from './transaction.mapper.js';
import { TransactionsRepository } from './transactions.repository.js';

const CATEGORY_NOT_FOUND = 'Категория не найдена';
const TRANSACTION_NOT_FOUND = 'Транзакция не найдена';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactions: TransactionsRepository,
    private readonly queryBus: QueryBus,
  ) {}

  async create(
    userId: string,
    { date, ...input }: CreateTransactionInput,
  ): Promise<Transaction> {
    // Категория пользователя существует, значит, и сам пользователь тоже.
    await this.assertOwnCategory(userId, input.categoryId);
    const transaction = await this.transactions.create(userId, {
      ...input,
      date: toDbDate(date),
    });
    return toTransactionResponse(transaction);
  }

  async findAll(
    userId: string,
    query: ListTransactionsQuery,
  ): Promise<Transaction[]> {
    const transactions = await this.transactions.findMany(userId, {
      type: query.type,
      categoryId: query.categoryId,
      dateFrom: query.dateFrom ? toDbDate(query.dateFrom) : undefined,
      dateTo: query.dateTo ? toDbDate(query.dateTo) : undefined,
    });
    return transactions.map(toTransactionResponse);
  }

  async findOne(userId: string, id: string): Promise<Transaction> {
    const transaction = await this.transactions.findOne({ id, userId });
    if (!transaction) {
      throw new NotFoundException(TRANSACTION_NOT_FOUND);
    }
    return toTransactionResponse(transaction);
  }

  async update(
    userId: string,
    id: string,
    { date, ...input }: UpdateTransactionInput,
  ): Promise<Transaction> {
    if (input.categoryId) {
      await this.assertOwnCategory(userId, input.categoryId);
    }

    try {
      const transaction = await this.transactions.update(
        { id, userId },
        { ...input, date: date ? toDbDate(date) : undefined },
      );
      return toTransactionResponse(transaction);
    } catch (error) {
      if (hasPrismaCode(error, PrismaErrorCode.RecordNotFound)) {
        throw new NotFoundException(TRANSACTION_NOT_FOUND);
      }
      throw error;
    }
  }

  async remove(userId: string, id: string): Promise<void> {
    try {
      await this.transactions.delete({ id, userId });
    } catch (error) {
      if (hasPrismaCode(error, PrismaErrorCode.RecordNotFound)) {
        throw new NotFoundException(TRANSACTION_NOT_FOUND);
      }
      throw error;
    }
  }

  async summary(
    userId: string,
    { month, year }: TransactionSummaryQuery,
  ): Promise<TransactionSummary> {
    // Date.UTC сам переносит 13-й месяц в январь следующего года.
    const from = new Date(Date.UTC(year, month - 1, 1));
    const to = new Date(Date.UTC(year, month, 1));

    const [totals, categories] = await Promise.all([
      this.transactions.sumByCategory(userId, from, to),
      this.queryBus.execute(new GetUserCategoriesQuery(userId)),
    ]);
    const categoryById = new Map(categories.map((c) => [c.id, c]));

    // Деньги считаем в Decimal, не во float.
    let income = new Prisma.Decimal(0);
    let expense = new Prisma.Decimal(0);
    for (const { type, total } of totals) {
      if (type === 'INCOME') income = income.plus(total);
      else expense = expense.plus(total);
    }

    const byCategory = totals
      .toSorted((a, b) => b.total.comparedTo(a.total))
      .map(({ categoryId, type, total, count }) => {
        const category = categoryById.get(categoryId);
        // Категория транзакции всегда принадлежит её владельцу (assertOwnCategory).
        if (!category) {
          throw new Error(`Категория ${categoryId} не найдена у пользователя`);
        }
        return {
          categoryId,
          name: category.name,
          color: category.color,
          icon: category.icon,
          type,
          total: total.toFixed(2),
          count,
        };
      });

    return {
      month,
      year,
      income: income.toFixed(2),
      expense: expense.toFixed(2),
      balance: income.minus(expense).toFixed(2),
      byCategory,
    };
  }

  /** Чужая и несуществующая категория неразличимы: 400 в обоих случаях. */
  private async assertOwnCategory(
    userId: string,
    categoryId: string,
  ): Promise<void> {
    const category = await this.queryBus.execute(
      new GetCategoryQuery({ id: categoryId, userId }),
    );
    if (!category) {
      throw new BadRequestException(CATEGORY_NOT_FOUND);
    }
  }
}
