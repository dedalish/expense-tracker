import { Injectable } from '@nestjs/common';
import {
  Prisma,
  type Transaction,
  type TransactionType,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** Транзакция, принадлежащая конкретному пользователю. */
export interface TransactionKey {
  /** Id транзакции. */
  id: string;
  /** Id владельца. */
  userId: string;
}

/** Поля транзакции для записи в БД (без `userId`). */
export interface TransactionData {
  /** Сумма строкой, > 0 (`Decimal(12, 2)` в БД). */
  amount: string;
  /** Доход или расход: знак суммы задаёт тип. */
  type: TransactionType;
  /** Полночь UTC даты транзакции, см. `toDbDate`. */
  date: Date;
  /** Id категории того же пользователя. */
  categoryId: string;
  description?: string | null;
}

/** Фильтры списка; не заданный фильтр не применяется. */
export interface TransactionFilters {
  /** Начало периода включительно (полночь UTC). */
  dateFrom?: Date;
  /** Конец периода включительно (полночь UTC). */
  dateTo?: Date;
  type?: TransactionType;
  categoryId?: string;
}

/** Окно выборки: сколько пропустить и сколько взять. */
export interface PageWindow {
  skip: number;
  take: number;
}

/** Страница транзакций и их общее число по фильтрам. */
export interface TransactionsSlice {
  items: Transaction[];
  total: number;
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

  /**
   * Создаёт транзакцию.
   *
   * @param userId Id владельца.
   * @param data Поля транзакции; принадлежность категории проверяет сервис.
   * @returns Созданная запись.
   * @throws {Prisma.PrismaClientKnownRequestError} P2003 — категории или
   *   пользователя с таким id нет.
   */
  create(userId: string, data: TransactionData): Promise<Transaction> {
    return this.prisma.transaction.create({ data: { ...data, userId } });
  }

  /**
   * Страница транзакций пользователя и их общее число по тем же фильтрам.
   *
   * Оба запроса идут в одной транзакции БД (`$transaction`), поэтому
   * `items` и `total` согласованы. Сортировка: дата, затем id по убыванию.
   *
   * @param userId Id владельца.
   * @param filters Фильтры по дате, типу и категории.
   * @param window Сколько записей пропустить (`skip`) и взять (`take`).
   * @returns `{ items, total }`; за пределами данных `items` пуст.
   */
  async findMany(
    userId: string,
    filters: TransactionFilters,
    { skip, take }: PageWindow,
  ): Promise<TransactionsSlice> {
    const where = this.buildWhere(userId, filters);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        skip,
        take,
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return { items, total };
  }

  /**
   * Транзакция по паре `id` + `userId`.
   *
   * @param key Id транзакции и id владельца.
   * @returns Запись или `null`, если её нет или она чужая.
   */
  findOne(key: TransactionKey): Promise<Transaction | null> {
    return this.prisma.transaction.findUnique({ where: key });
  }

  /**
   * Частично изменяет транзакцию по паре `id` + `userId`.
   *
   * @param key Id транзакции и id владельца.
   * @param data Изменяемые поля; `undefined` поля не меняются.
   * @returns Запись после изменения.
   * @throws {Prisma.PrismaClientKnownRequestError} P2025 — транзакции нет
   *   или она чужая; P2003 — новой категории нет.
   */
  update(
    key: TransactionKey,
    data: Partial<TransactionData>,
  ): Promise<Transaction> {
    return this.prisma.transaction.update({ where: key, data });
  }

  /**
   * Удаляет транзакцию по паре `id` + `userId`.
   *
   * @param key Id транзакции и id владельца.
   * @returns Удалённая запись.
   * @throws {Prisma.PrismaClientKnownRequestError} P2025 — транзакции нет
   *   или она чужая.
   */
  delete(key: TransactionKey): Promise<Transaction> {
    return this.prisma.transaction.delete({ where: key });
  }

  /**
   * Суммы и число транзакций пользователя по категориям и типам
   * за полуинтервал дат `[from, to)`.
   *
   * @param userId Id владельца.
   * @param from Начало периода включительно (полночь UTC).
   * @param to Конец периода не включительно (полночь UTC).
   * @returns Группы без сортировки; категории без транзакций не попадают.
   */
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

  /**
   * Условие `where` для списка и подсчёта.
   *
   * `undefined` в фильтрах Prisma пропускает, поэтому не заданный фильтр
   * не сужает выборку.
   *
   * @param userId Id владельца, обязательное условие.
   * @param filters Необязательные фильтры.
   * @returns Условие для `findMany` и `count`.
   */
  private buildWhere(
    userId: string,
    filters: TransactionFilters,
  ): Prisma.TransactionWhereInput {
    return {
      userId,
      type: filters.type,
      categoryId: filters.categoryId,
      date: { gte: filters.dateFrom, lte: filters.dateTo },
    };
  }
}
