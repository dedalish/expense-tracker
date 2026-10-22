import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  PORT: z.coerce.number().int().positive().default(3001),
  WEB_ORIGIN: z.url().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(32),
  // Формат библиотеки ms: '15m', '1d', '7d'.
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+(ms|s|m|h|d|w|y)$/)
    .default('1d'),
});

export type Env = z.infer<typeof envSchema>;

/** Для ConfigModule.forRoot({ validate }): с неверным .env приложение не стартует. */
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(
      `Некорректные переменные окружения:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
