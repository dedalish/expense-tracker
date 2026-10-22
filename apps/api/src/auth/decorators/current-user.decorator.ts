import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedRequest, JwtPayload } from '../auth.types.js';

/**
 * Параметр-декоратор: payload токена текущего пользователя
 * (`sub` — id пользователя, `email`).
 *
 * Работает только на защищённых роутах: `AuthGuard` кладёт payload
 * в `request.user`.
 *
 * @throws {UnauthorizedException} 401 — `request.user` пуст (декоратор
 *   стоит на роуте с `@Public()`).
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtPayload => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new UnauthorizedException();
    }
    return request.user;
  },
);
