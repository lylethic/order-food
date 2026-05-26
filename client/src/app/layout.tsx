import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import AppProvider from '@/app/app-provider';
import SlideSession from '@/components/slide-session';
import { baseOpenGraph } from '@/app/shared-metadata';
import Header from '@/components/header';
// import dynamic from 'next/dynamic'
import './globals.css';
// const Header = dynamic(() => import('@/components/header'), { ssr: false })
const inter = Inter({ subsets: ['vietnamese'] });

export const metadata: Metadata = {
  title: {
    template: '%s | RUBYKET',
    default: 'RUBYKET',
  },
  description: 'A website Restaurant ordering food',
  openGraph: baseOpenGraph,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-screen`}
        suppressHydrationWarning
      >
        <Toaster />
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <AppProvider>
            {/* <Header /> */}
            {children}
            <SlideSession />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
