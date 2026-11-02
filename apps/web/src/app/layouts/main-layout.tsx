import { redirect } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import { getCurrentUser } from '@/entities/user';
import { AppSidebar } from '@/widgets/app-sidebar';
import { LogoMark } from '@/shared/ui/logo-mark';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/shared/ui/sidebar';
import { Toaster } from '@/shared/ui/sonner';
import { TimeZoneSync } from '../providers/time-zone-sync';

/** Ширина узкой панели меню на широком экране. */
const RAIL_WIDTH = '4.75rem';

/** Оболочка страниц для вошедшего пользователя: боковое меню и контент. */
export async function MainLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  // Cookie есть (иначе proxy не пустил бы), но api токен не принял.
  if (!user) redirect('/logout');

  return (
    // На широком экране меню всегда узкое (только иконки): open={false}
    // без обработчика не даёт развернуть его сочетанием клавиш.
    <SidebarProvider
      open={false}
      style={{ '--sidebar-width-icon': RAIL_WIDTH } as CSSProperties}
    >
      <AppSidebar user={user} />
      <SidebarInset className="bg-background">
        {/* На широком экране меню видно всегда, кнопка нужна на телефоне. */}
        <header className="flex h-16 items-center gap-3 px-4 md:hidden">
          <SidebarTrigger
            aria-label="Открыть меню"
            variant="secondary"
            className="size-10 rounded-full bg-card"
          />
          <LogoMark className="size-7 text-primary" />
          <span className="font-semibold tracking-tight">Expense Tracker</span>
        </header>
        <div className="mx-auto w-full max-w-6xl px-4 pt-2 pb-10 md:px-10 md:py-10">
          {children}
        </div>
      </SidebarInset>
      <Toaster richColors position="top-center" />
      <TimeZoneSync />
    </SidebarProvider>
  );
}
