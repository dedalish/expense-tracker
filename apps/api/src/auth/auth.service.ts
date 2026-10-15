import type {
  AuthResponse,
  LoginInput,
  PublicUser,
  RegisterInput,
  UpdateProfileInput,
} from '@expense-tracker/shared';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import type { User } from '../generated/prisma/client.js';
import { CreateUserCommand } from '../users/commands/create-user.command.js';
import { UpdateUserNameCommand } from '../users/commands/update-user-name.command.js';
import { GetUserByEmailQuery } from '../users/queries/get-user-by-email.query.js';
import { GetUserByIdQuery } from '../users/queries/get-user-by-id.query.js';
import { toPublicUser } from '../users/user.mapper.js';
import type { JwtPayload } from './auth.types.js';
import { PasswordService } from './password.service.js';

const INVALID_CREDENTIALS = 'Неверный email или пароль';

@Injectable()
export class AuthService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly jwt: JwtService,
    private readonly passwords: PasswordService,
  ) {}

  async register({
    name,
    email,
    password,
  }: RegisterInput): Promise<AuthResponse> {
    const passwordHash = await this.passwords.hash(password);
    const user = await this.commandBus.execute(
      // registerSchema пропускает только personalDataConsent: true,
      // поэтому здесь фиксируем момент согласия. Время ставит сервер.
      new CreateUserCommand({
        name,
        email,
        passwordHash,
        personalDataConsentAt: new Date(),
      }),
    );
    return this.createAuthResponse(user);
  }

  async login({ email, password }: LoginInput): Promise<AuthResponse> {
    const user = await this.queryBus.execute(new GetUserByEmailQuery(email));

    // Одинаковый ответ и по времени, и по тексту: нельзя узнать, есть ли такой email.
    if (!user) {
      await this.passwords.verifyDummy(password);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    if (!(await this.passwords.verify(user.passwordHash, password))) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    return this.createAuthResponse(user);
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.queryBus.execute(new GetUserByIdQuery(userId));
    // Токен валиден, но пользователя уже нет (например, удалён).
    if (!user) {
      throw new UnauthorizedException();
    }
    return toPublicUser(user);
  }

  async updateProfile(
    userId: string,
    { name }: UpdateProfileInput,
  ): Promise<PublicUser> {
    const user = await this.commandBus.execute(
      new UpdateUserNameCommand(userId, name),
    );
    // Как и в getProfile: токен валиден, но пользователя уже нет.
    if (!user) {
      throw new UnauthorizedException();
    }
    return toPublicUser(user);
  }

  private async createAuthResponse(user: User): Promise<AuthResponse> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: toPublicUser(user),
    };
  }
}
