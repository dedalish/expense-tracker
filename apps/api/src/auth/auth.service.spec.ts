import { UnauthorizedException } from '@nestjs/common';
import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { JwtService } from '@nestjs/jwt';
import { describe, expect, it, vi } from 'vitest';
import type { User } from '../generated/prisma/client.js';
import { CreateUserCommand } from '../users/commands/create-user.command.js';
import { UpdateUserNameCommand } from '../users/commands/update-user-name.command.js';
import { GetUserByEmailQuery } from '../users/queries/get-user-by-email.query.js';
import { AuthService } from './auth.service.js';

const user: User = {
  id: '0199a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b',
  name: 'Иван',
  email: 'ivan@example.com',
  passwordHash: 'stored-hash',
  personalDataConsentAt: new Date('2026-01-01T00:00:00.000Z'),
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function setup() {
  const commandBus = { execute: vi.fn() };
  const queryBus = { execute: vi.fn() };
  const jwt = { signAsync: vi.fn().mockResolvedValue('signed-token') };
  const passwords = {
    hash: vi.fn().mockResolvedValue('new-hash'),
    verify: vi.fn(),
    verifyDummy: vi.fn().mockResolvedValue(undefined),
  };
  const service = new AuthService(
    commandBus as unknown as CommandBus,
    queryBus as unknown as QueryBus,
    jwt as unknown as JwtService,
    passwords,
  );
  return { service, commandBus, queryBus, jwt, passwords };
}

describe('AuthService.register', () => {
  it('передаёт в команду хэш, а не пароль', async () => {
    const { service, commandBus, passwords } = setup();
    commandBus.execute.mockResolvedValue(user);

    await service.register({
      name: user.name,
      email: user.email,
      password: 'plain-password',
      personalDataConsent: true,
    });

    expect(passwords.hash).toHaveBeenCalledWith('plain-password');
    expect(commandBus.execute).toHaveBeenCalledWith(
      new CreateUserCommand({
        name: user.name,
        email: user.email,
        passwordHash: 'new-hash',
        personalDataConsentAt: expect.any(Date) as Date,
      }),
    );
  });

  it('возвращает токен и пользователя без хэша пароля', async () => {
    const { service, commandBus, jwt } = setup();
    commandBus.execute.mockResolvedValue(user);

    const response = await service.register({
      name: user.name,
      email: user.email,
      password: 'plain-password',
      personalDataConsent: true,
    });

    expect(jwt.signAsync).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
    });
    expect(response.accessToken).toBe('signed-token');
    expect(response.user).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });
});

describe('AuthService.login', () => {
  it('возвращает токен при верном пароле', async () => {
    const { service, queryBus, passwords } = setup();
    queryBus.execute.mockResolvedValue(user);
    passwords.verify.mockResolvedValue(true);

    const response = await service.login({
      email: user.email,
      password: 'plain-password',
    });

    expect(queryBus.execute).toHaveBeenCalledWith(
      new GetUserByEmailQuery(user.email),
    );
    expect(passwords.verify).toHaveBeenCalledWith(
      'stored-hash',
      'plain-password',
    );
    expect(response.accessToken).toBe('signed-token');
    expect(response.user).not.toHaveProperty('passwordHash');
  });

  it('бросает 401 при неверном пароле', async () => {
    const { service, queryBus, passwords, jwt } = setup();
    queryBus.execute.mockResolvedValue(user);
    passwords.verify.mockResolvedValue(false);

    await expect(
      service.login({ email: user.email, password: 'wrong' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('бросает тот же 401 для неизвестного email и тратит время на проверку', async () => {
    const { service, queryBus, passwords } = setup();
    queryBus.execute.mockResolvedValue(null);

    await expect(
      service.login({ email: 'nobody@example.com', password: 'whatever' }),
    ).rejects.toThrow('Неверный email или пароль');
    expect(passwords.verifyDummy).toHaveBeenCalledWith('whatever');
    expect(passwords.verify).not.toHaveBeenCalled();
  });
});

describe('AuthService.getProfile', () => {
  it('возвращает публичного пользователя', async () => {
    const { service, queryBus } = setup();
    queryBus.execute.mockResolvedValue(user);

    await expect(service.getProfile(user.id)).resolves.toMatchObject({
      id: user.id,
      email: user.email,
    });
  });

  it('бросает 401, если пользователь удалён', async () => {
    const { service, queryBus } = setup();
    queryBus.execute.mockResolvedValue(null);

    await expect(service.getProfile(user.id)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});

describe('AuthService.updateProfile', () => {
  it('меняет имя через команду и отдаёт пользователя без хэша', async () => {
    const { service, commandBus } = setup();
    commandBus.execute.mockResolvedValue({ ...user, name: 'Пётр' });

    const result = await service.updateProfile(user.id, { name: 'Пётр' });

    expect(commandBus.execute).toHaveBeenCalledWith(
      new UpdateUserNameCommand(user.id, 'Пётр'),
    );
    expect(result).toMatchObject({ id: user.id, name: 'Пётр' });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('бросает 401, если пользователь удалён', async () => {
    const { service, commandBus } = setup();
    commandBus.execute.mockResolvedValue(null);

    await expect(
      service.updateProfile(user.id, { name: 'Пётр' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
