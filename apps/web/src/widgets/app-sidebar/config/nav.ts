import {
  ArrowLeftRight,
  LayoutDashboard,
  type LucideIcon,
  Tags,
  UserRound,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Главная', icon: LayoutDashboard },
  { href: '/transactions', label: 'Транзакции', icon: ArrowLeftRight },
  { href: '/categories', label: 'Категории', icon: Tags },
  { href: '/profile', label: 'Профиль', icon: UserRound },
];
