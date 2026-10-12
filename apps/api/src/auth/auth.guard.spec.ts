import 'reflect-metadata';
import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { describe, expect, it } from 'vitest';
import { AuthGuard } from './auth.guard.js';
import type { AuthenticatedRequest } from './auth.types.js';
import { IS_PUBLIC_KEY } from './decorators/public.decorator.js';

const SECRET = 'test-secret-of-at-least-32-characters';
const payload = { sub: 'user-id', email: 'ivan@example.com' };

const publicHandler = () => undefined;
const protectedHandler = () => undefined;
Reflect.defineMetadata(IS_PUBLIC_KEY, true, publicHandler);

class TestController {}

function setup() {
  const jwt = new JwtService({ secret: SECRET });
  const guard = new AuthGuard(jwt, new Reflector());

  const createContext = (
    handler: () => undefined,
    authorization?: string,
  ): { context: ExecutionContext; request: AuthenticatedRequest } => {
    const request = { headers: { authorization } } as AuthenticatedRequest;
    const context = {
      getHandler: () => handler,
      getClass: () => TestController,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    return { context, request };
  };

  return { jwt, guard, createContext };
}

describe('AuthGuard', () => {
  it('пропускает @Public() роут без токена', async () => {
    const { guard, createContext } = setup();

    await expect(
      guard.canActivate(createContext(publicHandler).context),
    ).resolves.toBe(true);
  });

  it('бросает 401 без заголовка Authorization', async () => {
    const { guard, createContext } = setup();

    await expect(
      guard.canActivate(createContext(protectedHandler).context),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('бросает 401 для схемы, отличной от Bearer', async () => {
    const { jwt, guard, createContext } = setup();
    const token = await jwt.signAsync(payload);

    await expect(
      guard.canActivate(
        createContext(protectedHandler, `Basic ${token}`).context,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('бросает 401 для невалидного токена', async () => {
    const { guard, createContext } = setup();

    await expect(
      guard.canActivate(
        createContext(protectedHandler, 'Bearer not-a-jwt').context,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('бросает 401 для токена, подписанного чужим секретом', async () => {
    const { guard, createContext } = setup();
    const foreign = await new JwtService({
      secret: 'another-secret-of-at-least-32-chars!',
    }).signAsync(payload);

    await expect(
      guard.canActivate(
        createContext(protectedHandler, `Bearer ${foreign}`).context,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('бросает 401 для просроченного токена', async () => {
    const { jwt, guard, createContext } = setup();
    const expired = await jwt.signAsync(payload, { expiresIn: -10 });

    await expect(
      guard.canActivate(
        createContext(protectedHandler, `Bearer ${expired}`).context,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('кладёт payload в request.user при валидном токене', async () => {
    const { jwt, guard, createContext } = setup();
    const token = await jwt.signAsync(payload);
    const { context, request } = createContext(
      protectedHandler,
      `Bearer ${token}`,
    );

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toMatchObject(payload);
  });
});
