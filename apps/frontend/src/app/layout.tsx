import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StoreProvider } from '@/components/store-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Techno Takorai E-Sports Club',
  description: 'เว็บไซต์ชมรมอีสปอร์ต Techno Takorai สำหรับข้อมูลทีม การแข่งขัน และสินค้าชมรม',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="th"><body><StoreProvider><SiteHeader />{children}<SiteFooter /></StoreProvider></body></html>;
}
