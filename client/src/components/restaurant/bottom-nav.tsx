'use client';

import Link from 'next/link';
import type { SidebarVariant } from './sidebar';

export interface BottomNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.FC<{ className?: string; strokeWidth?: number }>;
}

interface Props {
  items: BottomNavItem[];
  activeId: string;
  variant?: SidebarVariant;
}

const variantActive: Record<SidebarVariant, string> = {
  customer: 'text-indigo-600',
  chef: 'text-orange-500',
  employee: 'text-teal-600',
};

const variantBg: Record<SidebarVariant, string> = {
  customer: 'bg-indigo-50',
  chef: 'bg-orange-50',
  employee: 'bg-teal-50',
};

export default function BottomNav({
  items,
  activeId,
  variant = 'customer',
}: Props) {
  const activeColor = variantActive[variant];
  const activeBg = variantBg[variant];

  return (
    <nav className='fixed bottom-0 left-0 right-0 border-t border-border z-30 flex md:hidden'>
      {items.map((item) => {
        const active = activeId === item.id;
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`flex-1 flex flex-col items-center py-3 gap-1 transition-all ${
              active ? activeColor : 'text-muted-foreground'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${active ? activeBg : ''}`}
            >
              <item.icon className='w-5 h-5' strokeWidth={active ? 2.5 : 2} />
            </div>
            <span className='text-[10px] font-bold uppercase tracking-tighter'>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
