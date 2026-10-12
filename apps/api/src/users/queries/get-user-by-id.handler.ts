import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { User } from '../../generated/prisma/client.js';
import { UsersRepository } from '../users.repository.js';
import { GetUserByIdQuery } from './get-user-by-id.query.js';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(private readonly users: UsersRepository) {}

  execute({ id }: GetUserByIdQuery): Promise<User | null> {
    return this.users.findById(id);
  }
}
