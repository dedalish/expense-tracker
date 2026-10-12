import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { QueryBus } from '@nestjs/cqrs';
import { describe, expect, it, vi } from 'vitest';
import {
  type Category as CategoryEntity,
  Prisma,
  type User,
} from '../generated/prisma/client.js';
import { GetUserByIdQuery } from '../users/queries/get-user-by-id.query.js';
import type { CategoriesRepository } from './categories.repository.js';
import { CategoriesService } from './categories.service.js';

const userId = '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b';
const categoryId = '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5c';

const category: CategoryEntity = {
  id: categoryId,
  name: 'Еда',
  color: '#ff8800',
  icon: '🍔',
  userId,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const input = { name: 'Еда', color: '#ff8800', icon: '🍔' };

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('prisma error', {
    code,
    clientVersion: 'test',
  });
}

function setup() {
  const repository = {
    create: vi.fn(),
    findAllByUser: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const user: Partial<User> = { id: userId };
  const queryBus = { execute: vi.fn().mockResolvedValue(user) };
  const service = new CategoriesService(
    repository as unknown as CategoriesRepository,
    queryBus as unknown as QueryBus,
  );
  return { service, repository, queryBus };
}

describe('CategoriesService.create', () => {
  it('проверяет пользователя через QueryBus и создаёт категорию', async () => {
    const { service, repository, queryBus } = setup();
    repository.create.mockResolvedValue(category);

    const result = await service.create(userId, input);

    expect(queryBus.execute).toHaveBeenCalledWith(new GetUserByIdQuery(userId));
    expect(repository.create).toHaveBeenCalledWith(userId, input);
    expect(result).toEqual({
      id: categoryId,
      name: 'Еда',
      color: '#ff8800',
      icon: '🍔',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(result).not.toHaveProperty('userId');
  });

  it('бросает 401, если пользователь удалён', async () => {
    const { service, repository, queryBus } = setup();
    queryBus.execute.mockResolvedValue(null);

    await expect(service.create(userId, input)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('превращает дубль названия (P2002) в 409', async () => {
    const { service, repository } = setup();
    repository.create.mockRejectedValue(prismaError('P2002'));

    await expect(service.create(userId, input)).rejects.toThrow(
      ConflictException,
    );
  });
});

describe('CategoriesService.findAll', () => {
  it('возвращает категории пользователя без userId', async () => {
    const { service, repository } = setup();
    repository.findAllByUser.mockResolvedValue([category]);

    const result = await service.findAll(userId);

    expect(repository.findAllByUser).toHaveBeenCalledWith(userId);
    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('userId');
  });
});

describe('CategoriesService.update', () => {
  it('обновляет только категорию текущего пользователя', async () => {
    const { service, repository } = setup();
    repository.update.mockResolvedValue({ ...category, icon: '🥗' });

    const result = await service.update(userId, categoryId, { icon: '🥗' });

    expect(repository.update).toHaveBeenCalledWith(
      { id: categoryId, userId },
      { icon: '🥗' },
    );
    expect(result.icon).toBe('🥗');
  });

  it('бросает 404 для чужой или несуществующей категории (P2025)', async () => {
    const { service, repository } = setup();
    repository.update.mockRejectedValue(prismaError('P2025'));

    await expect(
      service.update(userId, categoryId, { icon: '🥗' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('превращает дубль названия (P2002) в 409', async () => {
    const { service, repository } = setup();
    repository.update.mockRejectedValue(prismaError('P2002'));

    await expect(
      service.update(userId, categoryId, { name: 'Транспорт' }),
    ).rejects.toThrow(ConflictException);
  });
});

describe('CategoriesService.remove', () => {
  it('удаляет категорию текущего пользователя', async () => {
    const { service, repository } = setup();
    repository.delete.mockResolvedValue(category);

    await expect(service.remove(userId, categoryId)).resolves.toBeUndefined();
    expect(repository.delete).toHaveBeenCalledWith({ id: categoryId, userId });
  });

  it('бросает 404 для чужой или несуществующей категории (P2025)', async () => {
    const { service, repository } = setup();
    repository.delete.mockRejectedValue(prismaError('P2025'));

    await expect(service.remove(userId, categoryId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('бросает 409, если в категории есть транзакции (P2003)', async () => {
    const { service, repository } = setup();
    repository.delete.mockRejectedValue(prismaError('P2003'));

    await expect(service.remove(userId, categoryId)).rejects.toThrow(
      'В категории есть транзакции',
    );
  });

  it('пробрасывает остальные ошибки как есть', async () => {
    const { service, repository } = setup();
    const failure = new Error('connection lost');
    repository.delete.mockRejectedValue(failure);

    await expect(service.remove(userId, categoryId)).rejects.toBe(failure);
  });
});
