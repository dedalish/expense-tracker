import type { PublicUser } from '@expense-tracker/shared';
import { Wallet } from 'lucide-react';
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
import { NavMenu } from './nav-menu';

/** Клиентская часть (подсветка текущего раздела) вынесена в NavMenu. */
export function AppSidebar({ user }: { user: PublicUser }) {
  return (
    <Sidebar>
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center gap-2 px-2 py-1.5 font-semibold"
        >
          <Wallet className="size-5" />
          Expense Tracker
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <NavMenu />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-2 py-1">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{user.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {user.email}
            </div>
          </div>
          <LogoutButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
