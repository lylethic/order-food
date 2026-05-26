'use client';
import React from 'react';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { usePathname } from 'next/navigation';
import { sidebarNavItems } from '@/lib/sidebarNavItems';
import { MenuIcon } from 'lucide-react';

const isSidebarItemActive = (pathname: string, href: string) => {
  if (href === '/admin') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function SideBarItem() {
  const pathname = usePathname();

  return (
    <header className='sticky top-0 z-10 border-b px-4 py-3 dark:border-border dark:bg-background lg:hidden'>
      <div className='flex items-center justify-between'>
        <Link
          href='#'
          className='flex items-center gap-2 font-bold outline-none'
          prefetch={false}
        >
          <span className='text-lg uppercase'>TASKHUB</span>
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant='outline' size='icon'>
              <MenuIcon className='h-8 w-8' />
              <span className='sr-only'>Toggle navigation</span>
            </Button>
          </SheetTrigger>
          <SheetContent side='left' className='w-64 overflow-hidden p-0'>
            <div className='flex h-full min-h-0 flex-col py-6'>
              <div className='flex min-h-0 flex-1 flex-col space-y-6 px-4'>
                <div className='px-2'>
                  <span className='text-lg uppercase font-bold'>TASKHUB</span>
                </div>
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
                            : 'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground dark:text-muted-foreground'
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
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
