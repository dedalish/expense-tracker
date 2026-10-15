import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getCurrentUser } from '@/entities/user';
import { AppSidebar } from '@/widgets/app-sidebar';
import { Separator } from '@/shared/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/shared/ui/sidebar';
import { Toaster } from '@/shared/ui/sonner';

/** Оболочка страниц для вошедшего пользователя: боковое меню и контент. */
export async function MainLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  // Cookie есть (иначе proxy не пустил бы), но api токен не принял.
  if (!user) redirect('/logout');

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        {/* На широком экране меню видно всегда, кнопка нужна на телефоне. */}
        <header className="flex h-12 items-center gap-2 border-b px-4 md:hidden">
          <SidebarTrigger aria-label="Открыть меню" />
          <Separator orientation="vertical" className="h-4" />
          <span className="font-semibold">Expense Tracker</span>
        </header>
        <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
          {children}
        </div>
      </SidebarInset>
      <Toaster richColors position="top-center" />
    </SidebarProvider>
  );
}
