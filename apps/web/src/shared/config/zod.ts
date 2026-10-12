import { z } from 'zod';

// Схемы общие с api, поэтому русские тексты ошибок задаются глобально здесь,
// а не в самих схемах. Импортируется ради побочного эффекта в клиентских формах.
z.config(z.locales.ru());

const pluralRules = new Intl.PluralRules('ru');
const CHARS = {
  one: 'символ',
  few: 'символа',
  many: 'символов',
  other: 'символа',
};

function chars(count: number | bigint): string {
  const form = pluralRules.select(Number(count)) as keyof typeof CHARS;
  return `${count} ${CHARS[form]}`;
}

z.config({
  customError: (issue) => {
    if (issue.code === 'too_small' && issue.origin === 'string') {
      return issue.minimum === 1
        ? 'Обязательное поле'
        : `Минимум ${chars(issue.minimum)}`;
    }
    if (issue.code === 'too_big' && issue.origin === 'string') {
      return `Максимум ${chars(issue.maximum)}`;
    }
    if (issue.code === 'invalid_format' && issue.format === 'email') {
      return 'Некорректный email';
    }
    // Остальное берётся из русской локали.
    return undefined;
  },
});
