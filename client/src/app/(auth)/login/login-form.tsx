'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoginBody, LoginBodyType } from '@/schemaValidations/auth.schema';
import authApiRequest from '@/apiRequests/auth';
import { useRouter } from 'next/navigation';
import { handleErrorApi } from '@/lib/utils';
import { useState } from 'react';
import { useAppContext } from '@/app/app-provider';
import { useToast } from '@/hooks/use-toast';

const LoginForm = () => {
  const { t } = useAppContext();
  const [loading, setLoading] = useState(false);
  const { setUser } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<LoginBodyType>({
    resolver: zodResolver(LoginBody),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginBodyType) {
    if (loading) return;
    setLoading(true);
    try {
      const result = await authApiRequest.login(values);
      // backend returns: { token, refreshToken, expiresIn, user, role }
      const {
        token,
        expiresAt,
        refreshToken,
        refreshTokenExpiresAt,
        user,
        role: rawRole,
      } = result.payload.data;

      // Normalise to string array
      const roleArray: string[] = Array.isArray(rawRole)
        ? rawRole.map(String)
        : rawRole
          ? [String(rawRole)]
          : [];
      const rolePrimary = roleArray[0] ?? 'CUSTOMER';

      // Persist tokens into cookies via Next.js API route
      await authApiRequest.auth({
        accessToken: token,
        refreshToken,
        expiresAt,
        refreshTokenExpiresAt,
        role: rolePrimary,
      });

      // Store user with role so app-provider can derive isChef/isEmployee
      setUser({ ...user, role: roleArray });

      toast({
        description: result.payload.message_en ?? result.payload.message,
      });

      const roles = roleArray.map((r) => r.toUpperCase());
      const dest = roles.includes('ADMIN')
        ? '/admin/categories'
        : roles.includes('CHEF')
          ? '/kitchen'
          : roles.includes('EMPLOYEE')
            ? '/server'
            : '/menu';
      router.push(dest);
      router.refresh();
    } catch (error: any) {
      handleErrorApi({ error, setError: form.setError });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-2 max-w-[600px] flex-shrink-0 w-full'
        noValidate
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  className='text-black'
                  placeholder='you@example.com'
                  type='email'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mật khẩu</FormLabel>
              <FormControl>
                <Input
                  className='text-black'
                  placeholder='••••••'
                  type='password'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type='submit'
          className='!mt-8 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl'
          disabled={loading}
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Button>

        <div className='mt-6 flex flex-col items-center gap-3'>
          <div className='w-full flex items-center gap-3'>
            <div className='flex-1 h-px bg-slate-200' />
            <span className='text-xs text-slate-400 font-medium'>or</span>
            <div className='flex-1 h-px bg-slate-200' />
          </div>
          <button
            type='button'
            onClick={() => router.push('/menu')}
            className='w-full py-3 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-all'
          >
            {t.continueAsGuest}
          </button>
          <button
            type='button'
            onClick={() => router.push('/register')}
            className='w-full py-3 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-all'
          >
            {t.continueRegister}
          </button>
        </div>
      </form>
    </Form>
  );
};

export default LoginForm;
