'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/shared/ui/sidebar';
import { NAV_ITEMS } from '../config/nav';

/** Пункты меню с подсветкой текущего раздела. */
export function NavMenu() {
  // Тип допускает null из-за совместимости с Pages Router, в App Router не бывает.
  const pathname = usePathname() ?? '/';
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <SidebarMenuItem key={href}>
          <SidebarMenuButton
            isActive={pathname === href || pathname.startsWith(`${href}/`)}
            // На телефоне меню выдвижное: после перехода его закрываем.
            render={<Link href={href} onClick={() => setOpenMobile(false)} />}
          >
            <Icon />
            <span>{label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
