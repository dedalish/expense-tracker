import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Не env('DATABASE_URL'): он бросает ошибку без переменной,
    // а `prisma generate` должен работать и без .env.
    url: process.env.DATABASE_URL ?? '',
  },
});
