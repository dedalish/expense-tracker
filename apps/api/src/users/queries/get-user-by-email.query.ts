import { Query } from '@nestjs/cqrs';
import type { User } from '../../generated/prisma/client.js';

/** Возвращает запись вместе с хэшем пароля: она нужна auth для проверки логина. */
export class GetUserByEmailQuery extends Query<User | null> {
  constructor(public readonly email: string) {
    super();
  }
}
