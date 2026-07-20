export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Inter, Playfair_Display, Outfit } from 'next/font/google';
import './globals.css';
import { ClientProviders } from './client-providers';
import { AmbientBackground } from '@/components/ui/AmbientBackground';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

import { brand } from '@/lib/brand';

export const metadata: Metadata = {
  title: `${brand.name} - ${brand.tagline}`,
  description: brand.description,
  keywords: ['olimpiada', 'ro\'yxatdan o\'tish', 'maktab', 'o\'quvchilar', 'offline'],
  authors: [{ name: `${brand.name} Team` }],
  icons: { icon: brand.logo },
  openGraph: {
    title: `${brand.name} - ${brand.tagline}`,
    description: brand.description,
    type: 'website',
    locale: 'uz_UZ',
    siteName: brand.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: brand.name,
    description: brand.tagline,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3007'),
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" className={`${inter.variable} ${playfair.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <script        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.classList.toggle('dark',t==='dark');return}var s=localStorage.getItem('olimpiy-settings');if(s){var o=JSON.parse(s);if(o.darkMode==='dark'){document.documentElement.classList.add('dark')}else if(o.darkMode==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches){document.documentElement.classList.add('dark');return}}document.documentElement.classList.add('dark')}catch(e){document.documentElement.classList.add('dark')}})()`}}
        />
      </head>
      <body className="font-sans antialiased bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-slate-100 relative min-h-screen">
        <AmbientBackground />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}