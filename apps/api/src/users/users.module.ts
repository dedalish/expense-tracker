import { Module } from '@nestjs/common';
import { CreateUserHandler } from './commands/create-user.handler.js';
import { UpdateUserNameHandler } from './commands/update-user-name.handler.js';
import { GetUserByEmailHandler } from './queries/get-user-by-email.handler.js';
import { GetUserByIdHandler } from './queries/get-user-by-id.handler.js';
import { UsersRepository } from './users.repository.js';

/**
 * Ничего не экспортирует: другие модули работают с пользователями
 * через CommandBus и QueryBus.
 */
@Module({
  providers: [
    UsersRepository,
    CreateUserHandler,
    UpdateUserNameHandler,
    GetUserByEmailHandler,
    GetUserByIdHandler,
  ],
})
export class UsersModule {}
