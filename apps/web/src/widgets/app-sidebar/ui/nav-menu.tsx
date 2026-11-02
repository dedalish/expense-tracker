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
    <SidebarMenu className="gap-2 group-data-[collapsible=icon]:items-center">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <SidebarMenuItem key={href}>
          <SidebarMenuButton
            isActive={pathname === href || pathname.startsWith(`${href}/`)}
            // В узкой панели подпись видна только во всплывающей подсказке.
            tooltip={label}
            className="h-11 rounded-full px-3.5 group-data-[collapsible=icon]:size-11! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground [&_svg]:size-5 group-data-[collapsible=icon]:[&>span]:hidden"
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
