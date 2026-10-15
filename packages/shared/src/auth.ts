import { z } from 'zod';

/** Email приводится к нижнему регистру до проверки: `A@B.com` и `a@b.com` один пользователь. */
const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

const nameSchema = z.string().trim().min(2).max(100);

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: z.string().min(8).max(128),
  // boolean, а не z.literal(true): у чекбокса формы начальное значение false.
  personalDataConsent: z.boolean().refine((value) => value, {
    error: 'Нужно согласие на обработку персональных данных',
  }),
});

export const loginSchema = z.object({
  email: emailSchema,
  // Правила сложности проверяются только при регистрации.
  password: z.string().min(1).max(128),
});

/** Изменение профиля текущего пользователя. */
export const updateProfileSchema = z.object({
  name: nameSchema,
});

/** Пользователь в ответах API: без хэша пароля. */
export const publicUserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string(),
  createdAt: z.iso.datetime(),
});

export const authResponseSchema = z.object({
  accessToken: z.string(),
  user: publicUserSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
