import { Command } from '@nestjs/cqrs';
import type { User } from '../../generated/prisma/client.js';

/** Результат null: пользователя с таким id нет. */
export class UpdateUserNameCommand extends Command<User | null> {
  constructor(
    public readonly id: string,
    public readonly name: string,
  ) {
    super();
  }
}
