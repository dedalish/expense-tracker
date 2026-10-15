import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Тот же алиас, что в tsconfig: `@/*` → `src/*`.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    // Пока тестируются только чистые функции, DOM не нужен.
    environment: 'node',
    include: ['src/**/*.spec.ts'],
  },
});
