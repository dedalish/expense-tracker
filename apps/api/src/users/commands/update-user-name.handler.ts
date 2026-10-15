import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { hasPrismaCode, PrismaErrorCode } from '../../common/prisma-errors.js';
import type { User } from '../../generated/prisma/client.js';
import { UsersRepository } from '../users.repository.js';
import { UpdateUserNameCommand } from './update-user-name.command.js';

@CommandHandler(UpdateUserNameCommand)
export class UpdateUserNameHandler implements ICommandHandler<UpdateUserNameCommand> {
  constructor(private readonly users: UsersRepository) {}

  async execute({ id, name }: UpdateUserNameCommand): Promise<User | null> {
    try {
      return await this.users.updateName(id, name);
    } catch (error) {
      if (hasPrismaCode(error, PrismaErrorCode.RecordNotFound)) return null;
      throw error;
    }
  }
}
