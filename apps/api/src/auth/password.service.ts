import { hash, verify } from '@node-rs/argon2';
import { Injectable } from '@nestjs/common';

/**
 * Хэширование паролей через argon2id (алгоритм и параметры по умолчанию
 * у @node-rs/argon2 соответствуют рекомендациям OWASP).
 */
@Injectable()
export class PasswordService {
  private dummyHash?: Promise<string>;

  hash(password: string): Promise<string> {
    return hash(password);
  }

  verify(passwordHash: string, password: string): Promise<boolean> {
    return verify(passwordHash, password);
  }

  /**
   * Тратит столько же времени, сколько `verify`. Вызывается, когда пользователь
   * не найден: по скорости ответа нельзя отличить несуществующий email.
   */
  async verifyDummy(password: string): Promise<void> {
    this.dummyHash ??= this.hash('dummy-password-for-timing');
    await verify(await this.dummyHash, password);
  }
}
