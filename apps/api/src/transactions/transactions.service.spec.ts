import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { QueryBus } from '@nestjs/cqrs';
import { describe, expect, it, vi } from 'vitest';
import { GetCategoryQuery } from '../categories/queries/get-category.query.js';
import { GetUserCategoriesQuery } from '../categories/queries/get-user-categories.query.js';
import {
  type Category,
  Prisma,
  type Transaction as TransactionEntity,
} from '../generated/prisma/client.js';
import type { TransactionsRepository } from './transactions.repository.js';
import { TransactionsService } from './transactions.service.js';

const userId = '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b';
const categoryId = '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5c';
const salaryId = '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5d';
const transactionId = '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5e';

const category: Category = {
  id: categoryId,
  name: 'Еда',
  color: '#ff8800',
  icon: '🍔',
  userId,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const salary: Category = { ...category, id: salaryId, name: 'Зарплата' };

const transaction: TransactionEntity = {
  id: transactionId,
  amount: new Prisma.Decimal('1250.5'),
  type: 'EXPENSE',
  description: null,
  date: new Date('2026-10-12T00:00:00.000Z'),
  categoryId,
  userId,
  createdAt: new Date('2026-10-12T10:00:00.000Z'),
  updatedAt: new Date('2026-10-12T10:00:00.000Z'),
};

const input = {
  amount: '1250.5',
  type: 'EXPENSE' as const,
  date: '2026-10-12',
  categoryId,
};

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('prisma error', {
    code,
    clientVersion: 'test',
  });
}

function setup() {
  const repository = {
    create: vi.fn(),
    findMany: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    sumByCategory: vi.fn(),
  };
  const queryBus = { execute: vi.fn().mockResolvedValue(category) };
  const service = new TransactionsService(
    repository as unknown as TransactionsRepository,
    queryBus as unknown as QueryBus,
  );
  return { service, repository, queryBus };
}

describe('TransactionsService.create', () => {
  it('проверяет категорию пользователя и сохраняет дату без времени', async () => {
    const { service, repository, queryBus } = setup();
    repository.create.mockResolvedValue(transaction);

    const result = await service.create(userId, input);

    expect(queryBus.execute).toHaveBeenCalledWith(
      new GetCategoryQuery({ id: categoryId, userId }),
    );
    expect(repository.create).toHaveBeenCalledWith(userId, {
      amount: '1250.5',
      type: 'EXPENSE',
      categoryId,
      date: new Date('2026-10-12T00:00:00.000Z'),
    });
    expect(result).toEqual({
      id: transactionId,
      amount: '1250.50',
      type: 'EXPENSE',
      description: null,
      date: '2026-10-12',
      categoryId,
      createdAt: '2026-10-12T10:00:00.000Z',
    });
    expect(result).not.toHaveProperty('userId');
  });

  it('бросает 400 для чужой или несуществующей категории', async () => {
    const { service, repository, queryBus } = setup();
    queryBus.execute.mockResolvedValue(null);

    await expect(service.create(userId, input)).rejects.toThrow(
      BadRequestException,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });
});

describe('TransactionsService.findAll', () => {
  it('переводит фильтры дат в Date и возвращает ответы без userId', async () => {
    const { service, repository } = setup();
    repository.findMany.mockResolvedValue([transaction]);

    const result = await service.findAll(userId, {
      dateFrom: '2026-10-01',
      type: 'EXPENSE',
    });

    expect(repository.findMany).toHaveBeenCalledWith(userId, {
      dateFrom: new Date('2026-10-01T00:00:00.000Z'),
      dateTo: undefined,
      type: 'EXPENSE',
      categoryId: undefined,
    });
    expect(result[0]).not.toHaveProperty('userId');
  });
});

describe('TransactionsService.findOne', () => {
  it('бросает 404 для чужой или несуществующей транзакции', async () => {
    const { service, repository } = setup();
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne(userId, transactionId)).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.findOne).toHaveBeenCalledWith({
      id: transactionId,
      userId,
    });
  });
});

describe('TransactionsService.update', () => {
  it('без смены категории не проверяет её', async () => {
    const { service, repository, queryBus } = setup();
    repository.update.mockResolvedValue(transaction);

    await service.update(userId, transactionId, { description: 'Обед' });

    expect(queryBus.execute).not.toHaveBeenCalled();
    expect(repository.update).toHaveBeenCalledWith(
      { id: transactionId, userId },
      { description: 'Обед', date: undefined },
    );
  });

  it('бросает 400, если новая категория чужая', async () => {
    const { service, repository, queryBus } = setup();
    queryBus.execute.mockResolvedValue(null);

    await expect(
      service.update(userId, transactionId, { categoryId: salaryId }),
    ).rejects.toThrow(BadRequestException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('бросает 404 для чужой или несуществующей транзакции (P2025)', async () => {
    const { service, repository } = setup();
    repository.update.mockRejectedValue(prismaError('P2025'));

    await expect(
      service.update(userId, transactionId, { amount: '10' }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('TransactionsService.remove', () => {
  it('удаляет транзакцию текущего пользователя', async () => {
    const { service, repository } = setup();
    repository.delete.mockResolvedValue(transaction);

    await expect(
      service.remove(userId, transactionId),
    ).resolves.toBeUndefined();
    expect(repository.delete).toHaveBeenCalledWith({
      id: transactionId,
      userId,
    });
  });

  it('бросает 404 (P2025)', async () => {
    const { service, repository } = setup();
    repository.delete.mockRejectedValue(prismaError('P2025'));

    await expect(service.remove(userId, transactionId)).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('TransactionsService.summary', () => {
  it('считает доходы, расходы и баланс в Decimal и склеивает категории', async () => {
    const { service, repository, queryBus } = setup();
    queryBus.execute.mockResolvedValue([category, salary]);
    repository.sumByCategory.mockResolvedValue([
      {
        categoryId,
        type: 'EXPENSE',
        total: new Prisma.Decimal('0.1'),
        count: 1,
      },
      {
        categoryId,
        type: 'EXPENSE',
        total: new Prisma.Decimal('0.2'),
        count: 2,
      },
      {
        categoryId: salaryId,
        type: 'INCOME',
        total: new Prisma.Decimal('1000'),
        count: 1,
      },
    ]);

    const result = await service.summary(userId, { month: 10, year: 2026 });

    expect(queryBus.execute).toHaveBeenCalledWith(
      new GetUserCategoriesQuery(userId),
    );
    expect(result).toMatchObject({
      month: 10,
      year: 2026,
      income: '1000.00',
      // 0.1 + 0.2 во float дало бы 0.30000000000000004.
      expense: '0.30',
      balance: '999.70',
    });
    expect(result.byCategory.map((c) => [c.name, c.type, c.total])).toEqual([
      ['Зарплата', 'INCOME', '1000.00'],
      ['Еда', 'EXPENSE', '0.20'],
      ['Еда', 'EXPENSE', '0.10'],
    ]);
  });

  it('берёт полуинтервал месяца', async () => {
    const { service, repository, queryBus } = setup();
    queryBus.execute.mockResolvedValue([]);
    repository.sumByCategory.mockResolvedValue([]);

    await service.summary(userId, { month: 2, year: 2028 });

    expect(repository.sumByCategory).toHaveBeenCalledWith(
      userId,
      new Date('2028-02-01T00:00:00.000Z'),
      new Date('2028-03-01T00:00:00.000Z'),
    );
  });

  it('декабрь заканчивается 1 января следующего года', async () => {
    const { service, repository, queryBus } = setup();
    queryBus.execute.mockResolvedValue([]);
    repository.sumByCategory.mockResolvedValue([]);

    const result = await service.summary(userId, { month: 12, year: 2026 });

    expect(repository.sumByCategory).toHaveBeenCalledWith(
      userId,
      new Date('2026-12-01T00:00:00.000Z'),
      new Date('2027-01-01T00:00:00.000Z'),
    );
    expect(result).toEqual({
      month: 12,
      year: 2026,
      income: '0.00',
      expense: '0.00',
      balance: '0.00',
      byCategory: [],
    });
  });
});
