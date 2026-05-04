import React from 'react';
import {
  HomeIcon,
  User2Icon,
  ChartLineIcon,
  Link2Icon,
} from 'lucide-react';

interface SidebarNavItem {
  href: string;
  icon: React.ElementType;
  title: string;
}

export const sidebarNavItems: SidebarNavItem[] = [
  {
    href: '/admin',
    icon: HomeIcon,
    title: 'Home',
  },
  {
    href: '/admin/urls',
    icon: Link2Icon,
    title: 'URLs',
  },
  {
    href: '/admin/statistic',
    icon: ChartLineIcon,
    title: 'Thống kê',
  },
  {
    href: '/admin/user',
    icon: User2Icon,
    title: 'Người dùng',
  },
];
