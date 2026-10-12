import type { Request } from 'express';

/** Содержимое access-токена. */
export interface JwtPayload {
  sub: string;
  email: string;
}

/** Запрос после AuthGuard: `user` заполнен только на защищённых роутах. */
export type AuthenticatedRequest = Request & { user?: JwtPayload };
