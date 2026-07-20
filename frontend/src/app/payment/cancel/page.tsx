'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PaymentCancelPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => { if (c <= 1) { clearInterval(interval); router.push('/'); return 0; } return c - 1; });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <title>To'lov bekor qilindi — Olimpiy</title>
      <meta name="description" content="To'lov bekor qilindi." />
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-amber-100 dark:from-amber-950 dark:via-slate-950 dark:to-amber-900" />
      <div className="absolute top-20 right-20 w-72 h-72 bg-amber-300/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
      <Card className="max-w-md w-full text-center relative border-amber-200 dark:border-amber-800 shadow-xl">
        <CardContent className="p-8">
          <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
            <XCircle className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="font-display font-bold text-2xl mb-2">To'lov bekor qilindi</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-2">Arizangiz saqlanib qoldi. Keyinroq to'lashingiz mumkin</p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mb-8">Bosh sahifa orqali arizalaringizni boshqarishingiz mumkin</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/"><Button variant="outline"><ArrowRight className="w-4 h-4 mr-2" />Bosh sahifa ({countdown}s)</Button></Link>
            <Link href="/auth"><Button>Arizalarim</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
