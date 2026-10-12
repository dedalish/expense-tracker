import { ConflictException } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { Prisma, type User } from '../../generated/prisma/client.js';
import { UsersRepository } from '../users.repository.js';
import { CreateUserCommand } from './create-user.command.js';

/** Код ошибки Prisma при нарушении unique-ограничения. */
const UNIQUE_VIOLATION = 'P2002';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(private readonly users: UsersRepository) {}

  async execute({ data }: CreateUserCommand): Promise<User> {
    try {
      return await this.users.create(data);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_VIOLATION
      ) {
        throw new ConflictException(
          'Пользователь с таким email уже существует',
        );
      }
      throw error;
    }
  }
}
