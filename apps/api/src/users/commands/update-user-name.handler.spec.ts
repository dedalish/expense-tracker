import { describe, expect, it, vi } from 'vitest';
import { Prisma, type User } from '../../generated/prisma/client.js';
import type { UsersRepository } from '../users.repository.js';
import { UpdateUserNameCommand } from './update-user-name.command.js';
import { UpdateUserNameHandler } from './update-user-name.handler.js';

const user: User = {
  id: '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b',
  name: 'Пётр',
  email: 'ivan@example.com',
  passwordHash: 'stored-hash',
  personalDataConsentAt: new Date('2026-01-01T00:00:00.000Z'),
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function setup() {
  const repository = { updateName: vi.fn() };
  const handler = new UpdateUserNameHandler(
    repository as unknown as UsersRepository,
  );
  return { handler, repository };
}

describe('UpdateUserNameHandler', () => {
  it('сохраняет новое имя', async () => {
    const { handler, repository } = setup();
    repository.updateName.mockResolvedValue(user);

    const result = await handler.execute(
      new UpdateUserNameCommand(user.id, 'Пётр'),
    );

    expect(repository.updateName).toHaveBeenCalledWith(user.id, 'Пётр');
    expect(result).toBe(user);
  });

  it('возвращает null, если пользователя нет', async () => {
    const { handler, repository } = setup();
    repository.updateName.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('not found', {
        code: 'P2025',
        clientVersion: 'test',
      }),
    );

    await expect(
      handler.execute(new UpdateUserNameCommand(user.id, 'Пётр')),
    ).resolves.toBeNull();
  });
});
