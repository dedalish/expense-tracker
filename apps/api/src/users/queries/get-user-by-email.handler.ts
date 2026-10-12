import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { User } from '../../generated/prisma/client.js';
import { UsersRepository } from '../users.repository.js';
import { GetUserByEmailQuery } from './get-user-by-email.query.js';

@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler implements IQueryHandler<GetUserByEmailQuery> {
  constructor(private readonly users: UsersRepository) {}

  execute({ email }: GetUserByEmailQuery): Promise<User | null> {
    return this.users.findByEmail(email);
  }
}
