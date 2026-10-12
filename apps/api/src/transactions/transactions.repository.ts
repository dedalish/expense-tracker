import { Injectable } from '@nestjs/common';
import {
  Prisma,
  type Transaction,
  type TransactionType,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** Транзакция, принадлежащая конкретному пользователю. */
export interface TransactionKey {
  id: string;
  userId: string;
}

export interface TransactionData {
  amount: string;
  type: TransactionType;
  date: Date;
  categoryId: string;
  description?: string | null;
}

export interface TransactionFilters {
  dateFrom?: Date;
  dateTo?: Date;
  type?: TransactionType;
  categoryId?: string;
}

/** Сумма транзакций одного типа в одной категории. */
export interface CategoryTotal {
  categoryId: string;
  type: TransactionType;
  total: Prisma.Decimal;
  count: number;
}

/**
 * Единственное место, где код обращается к `prisma.transaction`.
 * Поиск, `update` и `delete` идут по паре `id` + `userId`: чужая транзакция
 * для Prisma не найдена (P2025).
 */
@Injectable()
export class TransactionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, data: TransactionData): Promise<Transaction> {
    return this.prisma.transaction.create({ data: { ...data, userId } });
  }

  /** undefined в фильтрах Prisma пропускает. */
  findMany(
    userId: string,
    filters: TransactionFilters,
  ): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: {
        userId,
        type: filters.type,
        categoryId: filters.categoryId,
        date: { gte: filters.dateFrom, lte: filters.dateTo },
      },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
    });
  }

  findOne(key: TransactionKey): Promise<Transaction | null> {
    return this.prisma.transaction.findUnique({ where: key });
  }

  update(
    key: TransactionKey,
    data: Partial<TransactionData>,
  ): Promise<Transaction> {
    return this.prisma.transaction.update({ where: key, data });
  }

  delete(key: TransactionKey): Promise<Transaction> {
    return this.prisma.transaction.delete({ where: key });
  }

  /** Суммы по категориям и типам за полуинтервал дат `[from, to)`. */
  async sumByCategory(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<CategoryTotal[]> {
    const groups = await this.prisma.transaction.groupBy({
      by: ['categoryId', 'type'],
      where: { userId, date: { gte: from, lt: to } },
      _sum: { amount: true },
      _count: { _all: true },
    });

    return groups.map((group) => ({
      categoryId: group.categoryId,
      type: group.type,
      // В группе всегда есть строки, но тип _sum допускает null.
      total: group._sum.amount ?? new Prisma.Decimal(0),
      count: group._count._all,
    }));
  }
}
