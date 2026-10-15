import 'server-only';
import { type Category, categorySchema } from '@expense-tracker/shared';
import { cache } from 'react';
import { z } from 'zod';
import { authedFetch } from '@/shared/api/session';

/** Категории текущего пользователя. В пределах запроса вызывается один раз. */
export const getCategories = cache((): Promise<Category[]> =>
  authedFetch('/categories', z.array(categorySchema)),
);
