import { Command } from '@nestjs/cqrs';
import type { User } from '../../generated/prisma/client.js';
import type { CreateUserData } from '../users.repository.js';

export class CreateUserCommand extends Command<User> {
  constructor(public readonly data: CreateUserData) {
    super();
  }
}
