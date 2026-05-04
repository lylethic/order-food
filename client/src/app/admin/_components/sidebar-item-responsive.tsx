'use client';

import React from 'react';
import Link from 'next/link';
import { ModeToggle } from '@/components/mode-toggle';
import { usePathname } from 'next/navigation';
import { sidebarNavItems } from '@/lib/sidebarNavItems';

const isSidebarItemActive = (pathname: string, href: string) => {
  if (href === '/admin') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function SidebarItemResponsive() {
  const pathname = usePathname();

  return (
    <div className='hidden lg:sticky lg:top-0 lg:block lg:min-h-screen lg:w-64 lg:shrink-0 lg:self-stretch lg:border-r lg:bg-muted dark:lg:bg-card'>
      <div className='flex h-full min-h-0 flex-col py-6'>
        <div className='flex min-h-0 flex-1 flex-col space-y-6 px-4'>
          <Link
            href='#'
            className='flex items-center gap-2 font-bold outline-none'
            prefetch={false}
          >
            <div className='text-lg uppercase flex flex-col align-middle justify-center items-center'>
              <span>TASKHUB</span>
            </div>
          </Link>
          <nav className='min-h-0 flex-1 overflow-y-auto space-y-1 pr-2'>
            {sidebarNavItems.map((item, index) => {
              const isActive = isSidebarItemActive(pathname, item.href);

              return (
                <Link
                  key={index}
                  href={item.href}
                  className={`${
                    isActive
                      ? 'bg-blue-500 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white'
                      : 'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-foreground dark:text-muted-foreground dark:hover:bg-accent dark:hover:text-accent-foreground'
                  }`}
                  prefetch={false}
                >
                  {<item.icon />}
                  <span className='uppercase'>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className='space-y-4 border-t px-4 pt-4'>
          <div className='flex items-center justify-end gap-2 text-sm'>
            Theme <ModeToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
