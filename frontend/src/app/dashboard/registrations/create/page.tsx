'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trophy, MapPin, BookOpen, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import { Olympiad } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function CreateRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const olympiadId = searchParams.get('olympiad');

  const [olympiad, setOlympiad] = useState<Olympiad | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedLang, setSelectedLang] = useState<'uz' | 'ru' | 'en'>('uz');
  const [rooms, setRooms] = useState<any[]>([]);
  const [step, setStep] = useState<'form' | 'success'>('form');

  useEffect(() => {
    if (olympiadId) fetchOlympiad();
    else setLoading(false);
  }, [olympiadId]);

  const fetchOlympiad = async () => {
    try {
      const res = await api.olympiads.getOne(olympiadId!);
      const data = res.data?.data || res.data;
      setOlympiad(data);
      if (data?.id) {
        const locRes = await api.registrations.getAvailableLocations(data.id);
        const locData = locRes.data?.data || locRes.data;
        setLocations(Array.isArray(locData) ? locData : []);
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Xatolik', description: 'Ma\'lumotlarni yuklashda xatolik', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedLocation) { setRooms([]); return; }
    const loc = locations.find(l => l.id === selectedLocation);
    setRooms(loc?.rooms || []);
    setSelectedRoom('');
  }, [selectedLocation, locations]);

  const handleSubmit = async () => {
    if (!selectedLocation || !selectedRoom || !olympiadId) return;
    setSubmitting(true);
    try {
      await api.registrations.create({
        olympiadId,
        locationId: selectedLocation,
        roomId: selectedRoom,
        lang: selectedLang,
      });
      setStep('success');
      toast({ title: 'Ariza qabul qilindi!', description: 'To\'lovni amalga oshiring', variant: 'success' });
    } catch (err: unknown) {
      toast({ title: 'Xatolik', description: err instanceof Error ? err.message : 'Ariza yaratishda xatolik', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!olympiadId) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h2 className="font-display font-bold text-2xl mb-2">Olimpiada tanlanmagan</h2>
        <p className="text-slate-500 mb-6">Ariza yaratish uchun olimpiadani tanlang</p>
        <Button asChild><Link href="/dashboard/olympiads">Olimpiadalar ro'yxati</Link></Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!olympiad) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-300" />
        <h2 className="font-display font-bold text-2xl mb-2">Olimpiada topilmadi</h2>
        <p className="text-slate-500 mb-6">Bu olimpiada mavjud emas yoki o'chirilgan</p>
        <Button asChild><Link href="/dashboard/olympiads">Ortga qaytish</Link></Button>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <title>Ariza yaratish — Olimpiy</title>
        <meta name="description" content="Olimpiada uchun ariza yaratish." />
        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="font-display font-bold text-2xl mb-2">Ariza muvaffaqiyatli yaratildi!</h2>
        <p className="text-slate-500 mb-8">To'lovni amalga oshirish uchun arizalar sahifasiga o'ting</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild><Link href="/dashboard/registrations">Arizalarim</Link></Button>
          <Button asChild variant="outline"><Link href="/dashboard/olympiads">Olimpiadalar</Link></Button>
        </div>
      </div>
    );
  }

  const isPast = new Date(olympiad.examDate) < new Date();
  const isRegistrationOpen = new Date(olympiad.regEndDate) > new Date() && olympiad.isActive;

  if (!isRegistrationOpen || isPast) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <title>Ariza yaratish — Olimpiy</title>
        <meta name="description" content="Olimpiada uchun ariza yaratish." />
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-amber-300" />
        <h2 className="font-display font-bold text-2xl mb-2">Ro'yxatdan o'tish yopiq</h2>
        <p className="text-slate-500 mb-6">Ushbu olimpiada uchun ariza qabul qilinmayapti</p>
        <Button asChild><Link href="/dashboard/olympiads">Ortga qaytish</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <title>Ariza yaratish — Olimpiy</title>
        <meta name="description" content="Olimpiada uchun ariza yaratish." />
      <Button asChild variant="ghost" size="sm">
        <Link href={`/dashboard/olympiads/${olympiad.id}`}><ArrowLeft className="w-4 h-4 mr-1" />Ortga</Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{olympiad.title}</CardTitle>
              <p className="text-sm text-slate-500 mt-1">{formatDate(olympiad.examDate)}</p>
            </div>
            <Badge variant="success" className="text-sm">{formatPrice(Number(olympiad.price))}</Badge>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Joylashuvni tanlang</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium text-slate-700 dark:text-slate-300">Bino</label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger id="location">
                <SelectValue placeholder="Binoni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc: any) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name} {loc.address ? `(${loc.address})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {rooms.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="room" className="text-sm font-medium text-slate-700 dark:text-slate-300">Xona</label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger id="room">
                  <SelectValue placeholder="Xonani tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room: any) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.roomNumber} ({room.currentSeats || 0}/{room.capacity} o'rin bo'sh)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="lang" className="text-sm font-medium text-slate-700 dark:text-slate-300">Til</label>
            <Select value={selectedLang} onValueChange={v => setSelectedLang(v as 'uz' | 'ru' | 'en')}>
              <SelectTrigger id="lang">
                <SelectValue placeholder="Tilni tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uz">O'zbekcha</SelectItem>
                <SelectItem value="ru">Русский</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={!selectedLocation || !selectedRoom || submitting}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BookOpen className="w-4 h-4 mr-2" />}
            {submitting ? 'Yuborilmoqda...' : 'Ariza yuborish'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CreateRegistrationPage() {
  return <Suspense><CreateRegistrationContent /></Suspense>;
}
