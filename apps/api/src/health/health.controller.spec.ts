import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { HealthController } from './health.controller.js';

function createController(ping: () => Promise<unknown>) {
  const prisma = { $queryRaw: vi.fn(ping) } as unknown as PrismaService;
  return new HealthController(prisma);
}

describe('HealthController', () => {
  it('отвечает ok, когда база доступна', async () => {
    const controller = createController(() => Promise.resolve([]));

    await expect(controller.check()).resolves.toMatchObject({
      status: 'ok',
      database: 'up',
    });
  });

  it('отвечает degraded, когда база недоступна', async () => {
    const controller = createController(() =>
      Promise.reject(new Error('connection refused')),
    );

    await expect(controller.check()).resolves.toMatchObject({
      status: 'degraded',
      database: 'down',
    });
  });
});
