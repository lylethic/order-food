'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/app-provider';
import Spinner from '@/components/restaurant/spinner';

export default function RootRedirect() {
  const router = useRouter();
  const { user, isAdmin, isChef, isEmployee } = useAppContext();

  useEffect(() => {
    if (isAdmin) {
      router.replace('/admin/categories');
    } else if (isChef) {
      router.replace('/kitchen');
    } else if (isEmployee) {
      router.replace('/server');
    } else {
      router.replace('/menu');
    }
  }, [user, isAdmin, isChef, isEmployee, router]);

  return (
    <div className='min-h-screen flex items-center justify-center'>
      <div className='flex flex-col items-center gap-4'>
        <div className='w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg'>
          <span className='text-white font-extrabold text-xl'>R</span>
        </div>
        <Spinner size='lg' />
      </div>
    </div>
  );
}
