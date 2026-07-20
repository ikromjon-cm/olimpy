'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, ArrowLeft, Pencil } from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';

export default function AdminOlympiadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [olympiad, setOlympiad] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) fetchOlympiad(); }, [id]);

  const fetchOlympiad = async () => {
    try {
      setLoading(true);
      const res = await api.olympiads.getOneAdmin(id as string);
      setOlympiad(res.data?.data || res.data);
    } catch { toast({ title: 'Xatolik', description: 'Olimpiada ma\'lumotlarini yuklashda xatolik', variant: 'error' }); }
    finally { setLoading(false); }
  };

  const toggleActive = async () => {
    try {
      await api.olympiads.toggleActive(id as string);
      toast({ title: 'Holat o\'zgartirildi' });
      fetchOlympiad();
    } catch (err: unknown) { toast({ title: 'Xatolik', description: err instanceof Error ? err.message : 'Xatolik yuz berdi', variant: 'error' }); }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-48" /><Skeleton className="h-64" /></div>;
  if (!olympiad) return <div className="text-center py-12 text-slate-500">Olimpiada topilmadi</div>;

  return (
    <div className="space-y-6">
      <title>Olimpiada tafsilotlari — Olimpiy Admin</title>
      <meta name="description" content="Olimpiada tafsilotlari va arizalar." />
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Orqaga"><ArrowLeft className="w-5 h-5" /></Button>
        <h1 className="font-display font-bold text-2xl">{olympiad.title}</h1>
        <Badge variant={olympiad.isActive ? 'success' : 'default'}>{olympiad.isActive ? 'Faol' : 'Nofaol'}</Badge>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Fan</p><p className="font-semibold">{olympiad.subject}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Narx</p><p className="font-semibold">{formatPrice(Number(olympiad.price))}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Imtihon sanasi</p><p className="font-semibold">{formatDate(olympiad.examDate)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-slate-500">Jami arizalar</p><p className="font-semibold">{olympiad.stats?.totalRegistrations || 0}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Arizalar ({olympiad.registrations?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>F.I.O</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>To'lov</TableHead>
                <TableHead>Bino/Xona</TableHead>
                <TableHead>Parta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(olympiad.registrations || []).map((reg: any) => (
                <TableRow key={reg.id}>
                  <TableCell>{reg.user?.fullName}</TableCell>
                  <TableCell>{reg.user?.phoneNumber}</TableCell>
                  <TableCell><Badge variant={reg.status === 'PAID' ? 'success' : reg.status === 'PENDING' ? 'warning' : 'error'}>{reg.status}</Badge></TableCell>
                  <TableCell><Badge variant={reg.payment?.status === 'SUCCESS' ? 'success' : 'secondary'}>{reg.payment?.status || 'YO\'Q'}</Badge></TableCell>
                  <TableCell>{reg.location?.name} / {reg.room?.roomNumber}</TableCell>
                  <TableCell className="text-center">{reg.seatNumber}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex gap-2 flex-wrap">
        <Button onClick={toggleActive}>{olympiad.isActive ? 'To\'xtatish' : 'Faollashtirish'}</Button>
        <Link href={`/admin/olympiads/${id}/edit`}><Button variant="outline"><Pencil className="w-4 h-4 mr-2" />Tahrirlash</Button></Link>
        <Link href={`/admin/registrations?olympiadId=${id}`}><Button variant="outline"><Users className="w-4 h-4 mr-2" />Arizalar</Button></Link>
      </div>
    </div>
  );
}
