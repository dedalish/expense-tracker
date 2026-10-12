import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { Prisma, type User } from '../../generated/prisma/client.js';
import type { UsersRepository } from '../users.repository.js';
import { CreateUserCommand } from './create-user.command.js';
import { CreateUserHandler } from './create-user.handler.js';

const data = {
  name: 'Иван',
  email: 'ivan@example.com',
  passwordHash: 'hash',
  personalDataConsentAt: new Date('2026-01-01T00:00:00.000Z'),
};

function setup(create: () => Promise<User>) {
  const repository = { create: vi.fn(create) };
  const handler = new CreateUserHandler(
    repository as unknown as UsersRepository,
  );
  return { handler, repository };
}

describe('CreateUserHandler', () => {
  it('создаёт пользователя через репозиторий', async () => {
    const created = { id: 'id', ...data } as User;
    const { handler, repository } = setup(() => Promise.resolve(created));

    await expect(handler.execute(new CreateUserCommand(data))).resolves.toBe(
      created,
    );
    expect(repository.create).toHaveBeenCalledWith(data);
  });

  it('превращает нарушение unique (P2002) в ConflictException', async () => {
    const { handler } = setup(() =>
      Promise.reject(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      ),
    );

    await expect(handler.execute(new CreateUserCommand(data))).rejects.toThrow(
      ConflictException,
    );
  });

  it('пробрасывает остальные ошибки как есть', async () => {
    const failure = new Error('connection lost');
    const { handler } = setup(() => Promise.reject(failure));

    await expect(handler.execute(new CreateUserCommand(data))).rejects.toBe(
      failure,
    );
  });
});
