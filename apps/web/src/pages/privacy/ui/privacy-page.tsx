import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Политика обработки персональных данных · Expense Tracker',
};

// Шаблон для учебного проекта. Перед реальным запуском текст нужно заменить
// на согласованный с юристом: указать оператора, адрес, контакты.
export function PrivacyPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10 text-sm leading-relaxed">
      <Link href="/" className="text-muted-foreground underline">
        ← На главную
      </Link>

      <h1 className="text-2xl font-semibold">
        Политика обработки персональных данных
      </h1>
      <p className="text-muted-foreground">
        Документ составлен в соответствии с Федеральным законом от 27.07.2006 №
        152-ФЗ «О персональных данных».
      </p>

      <Section title="1. Оператор">
        Оператор персональных данных — владелец сервиса Expense Tracker (далее —
        Оператор). Связаться с Оператором можно по адресу электронной почты,
        указанному на сайте сервиса.
      </Section>

      <Section title="2. Какие данные обрабатываются">
        <ul className="list-disc space-y-1 pl-5">
          <li>имя;</li>
          <li>адрес электронной почты;</li>
          <li>
            сведения о расходах и категориях, которые пользователь вносит сам;
          </li>
          <li>дата регистрации и дата дачи согласия.</li>
        </ul>
        Пароль хранится только в виде необратимого хэша.
      </Section>

      <Section title="3. Цели обработки">
        Регистрация и идентификация пользователя, предоставление доступа к
        сервису учёта расходов, обеспечение безопасности учётной записи.
      </Section>

      <Section title="4. Действия с данными">
        Сбор, запись, хранение, использование, обновление, удаление и
        уничтожение. Данные не передаются третьим лицам, кроме случаев,
        предусмотренных законодательством РФ.
      </Section>

      <Section title="5. Срок действия согласия">
        Согласие действует до удаления учётной записи или до его отзыва. После
        отзыва согласия данные уничтожаются в течение 30 дней, если иное не
        требуется законом.
      </Section>

      <Section title="6. Права пользователя">
        Пользователь вправе запросить сведения об обработке своих данных,
        потребовать их уточнения или удаления, а также отозвать согласие,
        направив Оператору письменное обращение.
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="text-foreground/90">{children}</div>
    </section>
  );
}
