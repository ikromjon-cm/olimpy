'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center p-12">
      <div className="glass-strong max-w-sm w-full p-8 text-center rounded-2xl space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <div>
          <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-1">
            Dashboard xatosi
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Ma'lumotlarni yuklashda xatolik yuz berdi.
          </p>
        </div>
        <Button onClick={reset} variant="primary" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Qayta urinish
        </Button>
      </div>
    </div>
  );
}
