import type { Request } from 'express';

/** Содержимое access-токена. */
export interface JwtPayload {
  /** Id пользователя. */
  sub: string;
  /** Email пользователя на момент выдачи токена. */
  email: string;
}

/** Запрос после AuthGuard: `user` заполнен только на защищённых роутах. */
export type AuthenticatedRequest = Request & { user?: JwtPayload };
