'use client';
import { useAppContext } from '@/app/app-provider';
import ButtonLogout from '@/components/button-logout';
import { ModeToggle } from '@/components/mode-toggle';
import Link from 'next/link';

export default function Header() {
  const { user } = useAppContext();
  return (
    <div className='flex items-center justify-center space-x-4'>
      <ul className='flex space-x-4'>
        <li>
          <Link href='/'>Home</Link>
        </li>

        {user ? (
          <>
            <li>
              <Link href={'/me'}>
                Xin chào <strong>{user.email}</strong>
              </Link>
            </li>
            <li>
              <ButtonLogout />
            </li>
          </>
        ) : (
          <>
            <li>
              <Link href='/login'>Đăng nhập</Link>
            </li>
            <li>
              <Link href='/register'>Đăng ký</Link>
            </li>
          </>
        )}
      </ul>
      <ModeToggle />
    </div>
  );
}
