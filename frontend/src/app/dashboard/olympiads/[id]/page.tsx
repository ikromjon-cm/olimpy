'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trophy, Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import { Olympiad } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function OlympiadDetailPage() {
  const { id } = useParams();
  const [olympiad, setOlympiad] = useState<Olympiad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchOlympiad();
  }, [id]);

  const fetchOlympiad = async () => {
    try {
      setLoading(true);
      const res = await api.olympiads.getOne(id as string);
      const d = res.data?.data || res.data;
      setOlympiad(d?.id ? d : null);
    } catch (err) {
      setError('Olimpiada ma\'lumotlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-64" />
      <Skeleton className="h-48" />
    </div>
  );

  if (error || !olympiad) return (
    <div className="max-w-3xl mx-auto text-center py-16">
      <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-300" />
      <h2 className="font-display font-bold text-2xl mb-2">Olimpiada topilmadi</h2>
      <p className="text-slate-500 mb-6">{error || 'Bu olimpiada mavjud emas yoki o\'chirilgan'}</p>
      <Button asChild><Link href="/dashboard/olympiads">Olimpiadalar ro'yxati</Link></Button>
    </div>
  );

  const isRegistrationOpen = new Date(olympiad.regEndDate) > new Date() && olympiad.isActive;
  const isPast = new Date(olympiad.examDate) < new Date();
  const daysLeft = Math.ceil((new Date(olympiad.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const regProgress = olympiad.maxCapacity ? ((olympiad._count?.registrations || 0) / olympiad.maxCapacity) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <title>Olimpiada — Olimpiy</title>
      <meta name="description" content="Olimpiada haqida batafsil ma'lumot." />
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/olympiads"><ArrowLeft className="w-4 h-4 mr-1" />Orqaga</Link>
        </Button>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-900 min-h-[200px]">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] bg-[length:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="relative p-8 text-white">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
            <Badge className="bg-white/20 backdrop-blur-md border border-white/20 text-white text-sm">
              {olympiad.subject}
            </Badge>
            {isPast ? (
              <Badge className="bg-slate-500/80 backdrop-blur-md text-white border-slate-400/30">Tugagan</Badge>
            ) : isRegistrationOpen ? (
              <Badge className="bg-emerald-500/80 backdrop-blur-md text-white border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.4)]">Ro'yxatdan o'tish ochiq</Badge>
            ) : (
              <Badge className="bg-amber-500/80 backdrop-blur-md text-white border-amber-400/30">Ro'yxatdan o'tish yopiq</Badge>
            )}
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl mb-3">{olympiad.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
            {olympiad.maxCapacity && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{olympiad._count?.registrations || 0} / {olympiad.maxCapacity} o'rin</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(olympiad.examDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>{formatPrice(Number(olympiad.price))}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Olimpiada haqida</CardTitle></CardHeader>
            <CardContent>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                {olympiad.description || 'Tavsif mavjud emas'}
              </p>
            </CardContent>
          </Card>

          {olympiad.locations && olympiad.locations.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Joylar</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {olympiad.locations.map((ol) => (
                  <div key={ol.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="p-2 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">{ol.location.name}</p>
                      {ol.location.address && <p className="text-sm text-slate-500">{ol.location.address}</p>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Muddatlar</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm text-slate-500">Imtihon sanasi</span>
                <p className="font-semibold">{formatDate(olympiad.examDate)}</p>
              </div>
              <div>
                <span className="text-sm text-slate-500">Ro'yxatdan o'tish tugash sanasi</span>
                <p className="font-semibold">{formatDate(olympiad.regEndDate)}</p>
              </div>
              {!isPast && daysLeft > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {isRegistrationOpen ? `Ro'yxatdan o'tish uchun ${Math.ceil((new Date(olympiad.regEndDate).getTime() - Date.now()) / (1000*60*60*24))} kun qoldi` : `${daysLeft} kundan keyin imtihon`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {olympiad.maxCapacity && (
            <Card>
              <CardHeader><CardTitle>Bandlik</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{olympiad._count?.registrations || 0} / {olympiad.maxCapacity}</span>
                    <span className="font-medium">{Math.round(regProgress)}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, regProgress)}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!isPast && isRegistrationOpen && (
            <Button asChild size="lg" className="w-full shadow-lg shadow-primary-500/20">
              <a href={`/dashboard/registrations/create?olympiad=${olympiad.id}`}>Ro'yxatdan o'tish</a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
