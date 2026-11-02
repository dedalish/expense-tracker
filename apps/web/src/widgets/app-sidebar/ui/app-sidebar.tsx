import type { PublicUser } from '@expense-tracker/shared';
import Link from 'next/link';
import { LogoutButton } from '@/features/auth';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from '@/shared/ui/sidebar';
import { LogoMark } from '@/shared/ui/logo-mark';
import { NavMenu } from './nav-menu';

/**
 * На широком экране меню — узкая белая колонка с иконками (свёрнутый режим
 * `icon`), на телефоне — выдвижная панель с подписями.
 * Клиентская часть (подсветка текущего раздела) вынесена в NavMenu.
 */
export function AppSidebar({ user }: { user: PublicUser }) {
  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      // Отступ слева равен зазору, который Sidebar резервирует под панель.
      className="group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+--spacing(4))] *:data-[slot=sidebar-inner]:rounded-[2.25rem] *:data-[slot=sidebar-inner]:shadow-none *:data-[slot=sidebar-inner]:ring-0 md:py-4 md:pr-0 md:pl-4"
    >
      <SidebarHeader className="items-center py-5 group-data-[collapsible=icon]:px-0">
        <Link
          href="/"
          aria-label="Expense Tracker, на главную"
          className="flex items-center gap-2.5 self-stretch px-2 font-semibold tracking-tight text-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <LogoMark className="size-9 text-primary" />
          <span className="group-data-[collapsible=icon]:hidden">
            Expense Tracker
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <NavMenu />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="items-center gap-3 pb-5">
        <LogoutButton
          view="icon"
          className="group-data-[collapsible=icon]:self-center"
        />
        <div className="flex items-center gap-3 self-stretch px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Link
            href="/profile"
            aria-label={`Профиль: ${user.name}`}
            title={user.name}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background uppercase outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {user.name.trim().charAt(0) || '?'}
          </Link>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-medium text-foreground">
              {user.name}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {user.email}
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
