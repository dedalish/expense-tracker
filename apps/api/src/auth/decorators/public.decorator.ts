import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Открывает роут без токена: AuthGuard включён глобально и защищает всё остальное. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
