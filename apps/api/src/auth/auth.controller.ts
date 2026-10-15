import {
  type AuthResponse,
  type LoginInput,
  loginSchema,
  type PublicUser,
  type RegisterInput,
  registerSchema,
  type UpdateProfileInput,
  updateProfileSchema,
} from '@expense-tracker/shared';
import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { AuthService } from './auth.service.js';
import type { JwtPayload } from './auth.types.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
  ): Promise<AuthResponse> {
    return this.auth.register(body);
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
  ): Promise<AuthResponse> {
    return this.auth.login(body);
  }

  @Get('me')
  me(@CurrentUser() user: JwtPayload): Promise<PublicUser> {
    return this.auth.getProfile(user.sub);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
  ): Promise<PublicUser> {
    return this.auth.updateProfile(user.sub, body);
  }
}
