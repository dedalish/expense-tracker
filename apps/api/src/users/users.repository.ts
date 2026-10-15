import { Injectable } from '@nestjs/common';
import type { User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  personalDataConsentAt: Date;
}

/** Единственное место, где код обращается к `prisma.user`. */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({ data });
  }

  updateName(id: string, name: string): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { name } });
  }
}
