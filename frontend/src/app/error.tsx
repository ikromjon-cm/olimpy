'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-strong max-w-md w-full p-10 text-center rounded-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white mb-2">
            Xatolik yuz berdi
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            Kutilmagan xatolik yuz berdi. Iltimos qayta urinib ko'ring yoki bosh sahifaga qayting.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-400 mt-2 font-mono">Error ID: {error.digest}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="primary" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Qayta urinish
          </Button>
          <Link href="/">
            <Button variant="outline" className="gap-2 w-full">
              <Home className="w-4 h-4" />
              Bosh sahifa
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
