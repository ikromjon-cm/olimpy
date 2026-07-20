'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ClipboardList, Plus, ArrowRight, Download } from 'lucide-react';
import { getStatusColor, getStatusLabel } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

export default function MyRegistrationsPage() {
  const { user } = useAuthStore();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRegistrations(); }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await api.registrations.getMine();
      const resData = res.data?.data || res.data;
      setRegistrations(Array.isArray(resData) ? resData : []);
    } catch (err) { console.error(err); toast({ title: 'Xatolik', description: 'Arizalarni yuklashda xatolik', variant: 'error' }); }
    finally { setLoading(false); }
  };

  const handleGenerateTicket = async (id: string) => {
    try { await api.registrations.generateTicket(id); toast({ title: 'Chipta generatsiya qilindi' }); }
    catch (err: unknown) { toast({ title: 'Xatolik', description: err instanceof Error ? err.message : 'Xatolik yuz berdi', variant: 'error' }); }
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24" />)}</div>;

  return (
    <div className="space-y-6">
      <title>Arizalarim — Olimpiy</title>
      <meta name="description" content="Barcha arizalaringiz ro'yxati." />
      <div className="glass-card p-6 lg:p-8 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white">Mening arizalarim</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Barcha arizalaringiz ro'yxati</p>
        </div>
        <Button asChild className="shadow-[0_4px_14px_rgba(99,102,241,0.3)]"><Link href="/dashboard/olympiads"><Plus className="w-4 h-4 mr-2" />Yangi ariza</Link></Button>
      </div>
      {registrations.length === 0 ? (
        <Card variant="strong" className="border border-white/40 dark:border-white/[0.06] shadow-apple-lg">
          <CardContent className="p-16 text-center">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="font-display font-semibold text-xl text-slate-900 dark:text-white mb-2">Arizalar mavjud emas</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Hali hech qanday olimpiadaga ariza bermagansiz</p>
            <Button asChild><Link href="/dashboard/olympiads">Olimpiadalarni ko'rish</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {registrations.map((reg, idx) => (
            <motion.div
              key={reg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card variant="strong" className="border border-white/40 dark:border-white/[0.06] shadow-apple hover:shadow-apple-lg transition-all duration-300 hover:-translate-y-0.5">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500/10 to-purple-500/10 border border-primary-500/20 flex items-center justify-center">
                    <ClipboardList className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">{reg.olympiad?.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{reg.location?.name} • {reg.room?.roomNumber}-xona • {reg.seatNumber}-parta</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={getStatusColor(reg.status)}>{getStatusLabel(reg.status)}</Badge>
                      {reg.payment?.status === 'SUCCESS' && <Badge variant="success">To'langan</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {reg.status === 'PAID' && (
                      <Button size="sm" variant="outline" onClick={() => handleGenerateTicket(reg.id)} className="shadow-sm">
                        <Download className="w-4 h-4 mr-1" /> Chipta
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" asChild aria-label="Ko'rish">
                      <Link href={`/dashboard/registrations/${reg.id}`}>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
