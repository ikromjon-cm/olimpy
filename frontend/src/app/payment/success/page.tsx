'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
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
      <title>To'lov muvaffaqiyatli — Olimpiy</title>
      <meta name="description" content="To'lov muvaffaqiyatli amalga oshirildi." />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 dark:from-emerald-950 dark:via-slate-950 dark:to-emerald-900" />
      <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-300/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />
      <Card className="max-w-md w-full text-center relative border-emerald-200 dark:border-emerald-800 shadow-xl">
        <CardContent className="p-8">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="font-display font-bold text-2xl mb-2">To'lov muvaffaqiyatli amalga oshirildi!</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">Chiptangizni shaxsiy kabinet orqali yuklab olishingiz mumkin</p>
          <Link href="/"><Button size="lg" className="shadow-lg shadow-emerald-500/20"><ArrowRight className="w-4 h-4 mr-2" />Bosh sahifaga o'tish ({countdown}s)</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return <Suspense><PaymentSuccessContent /></Suspense>;
}
