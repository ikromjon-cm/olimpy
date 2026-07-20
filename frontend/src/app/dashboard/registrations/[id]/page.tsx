'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, getStatusColor, getStatusLabel, formatPrice } from '@/lib/utils';

export default function RegistrationDetailPage() {
  const { id } = useParams();
  const [reg, setReg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchRegistration();
  }, [id]);

  const fetchRegistration = async () => {
    try { const res = await api.registrations.getOne(id as string); const d = res.data?.data; if (d) setReg(d); }
    catch (err) { console.error(err); toast({ title: 'Xatolik', description: 'Ariza ma\'lumotlarini yuklashda xatolik', variant: 'error' }); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-48" /></div>;
  if (!reg) return <div className="text-center py-12 text-slate-500">Ariza topilmadi</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <title>Ariza ma'lumotlari — Olimpiy</title>
      <meta name="description" content="Ariza ma'lumotlari." />
      <h1 className="font-display font-bold text-2xl">Ariza ma'lumotlari</h1>
      <Card>
        <CardHeader><CardTitle>{reg.olympiad?.title}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-sm text-slate-500">Fan</span><p className="font-medium">{reg.olympiad?.subject}</p></div>
            <div><span className="text-sm text-slate-500">Holat</span><Badge variant={getStatusColor(reg.status)}>{getStatusLabel(reg.status)}</Badge></div>
            <div><span className="text-sm text-slate-500">Bino</span><p className="font-medium">{reg.location?.name}</p></div>
            <div><span className="text-sm text-slate-500">Xona / Parta</span><p className="font-medium">{reg.room?.roomNumber} / {reg.seatNumber}</p></div>
            <div><span className="text-sm text-slate-500">Til</span><p className="font-medium uppercase">{reg.lang}</p></div>
            <div><span className="text-sm text-slate-500">Imtihon sanasi</span><p className="font-medium">{formatDate(reg.olympiad?.examDate)}</p></div>
          </div>
          {reg.payment && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">To'lov ma'lumotlari</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-slate-500">To'lov holati</span><Badge variant={getStatusColor(reg.payment.status)}>{getStatusLabel(reg.payment.status)}</Badge></div>
                <div><span className="text-sm text-slate-500">Summa</span><p className="font-medium">{formatPrice(Number(reg.payment.amount || 0))}</p></div>
              </div>
            </div>
          )}
          {reg.result && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Natija</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-slate-500">Ball</span><p className="font-medium">{reg.result.score}</p></div>
                <div><span className="text-sm text-slate-500">O'rin</span><p className="font-medium">{reg.result.rank ? `${reg.result.rank}-o'rin` : 'Aniqlanmagan'}</p></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
