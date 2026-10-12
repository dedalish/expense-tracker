import type { PublicUser } from '@expense-tracker/shared';
import type { User } from '../generated/prisma/client.js';

/** Единственный путь пользователя наружу: без `passwordHash`. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}
