'use client';

import Link from 'next/link';
import { LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuthNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center shadow-[0_8px_30px_rgba(99,102,241,0.3)]">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5" strokeWidth="1.5"/>
                <line x1="12" y1="3" x2="12" y2="7"/><line x1="12" y1="17" x2="12" y2="21"/>
                <line x1="3" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="21" y2="12"/>
              </svg>
            </div>
            <span className="font-display font-bold text-2xl tracking-tight text-slate-900 dark:text-white">Olimpiy</span>
          </Link>
        </div>

        <div className="glass-strong p-10 text-center rounded-2xl space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white mb-2">
              Sahifa topilmadi
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Auth sahifalarida bunday sahifa mavjud emas.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth">
              <Button variant="primary" className="gap-2 w-full">
                <LogIn className="w-4 h-4" />
                Kirish
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="gap-2 w-full">
                <ArrowLeft className="w-4 h-4" />
                Bosh sahifa
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
