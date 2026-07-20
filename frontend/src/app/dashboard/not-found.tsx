'use client';

import Link from 'next/link';
import { SearchX, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardNotFound() {
  return (
    <div className="flex items-center justify-center p-12 min-h-[60vh]">
      <div className="glass-strong max-w-md w-full p-10 text-center rounded-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
          <SearchX className="w-8 h-8 text-amber-500" />
        </div>
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white mb-2">
            Sahifa topilmadi
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Dashboardda bunday sahifa mavjud emas. Sahifalar ro'yxatiga qayting.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard">
            <Button variant="primary" className="gap-2 w-full">
              <Home className="w-4 h-4" />
              Bosh sahifa
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="gap-2 w-full">
              <ArrowLeft className="w-4 h-4" />
              Asosiy sahifa
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
