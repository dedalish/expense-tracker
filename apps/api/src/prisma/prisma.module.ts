import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/** Делает `PrismaService` доступным во всех модулях без импорта. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
