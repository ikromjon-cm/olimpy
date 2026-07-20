'use client';


import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Calendar, MapPin, Clock, BookOpen, Zap, Search } from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import { Olympiad } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface OlympiadsPageProps {
  searchParams: { subject?: string; page?: string };
}

export default function OlympiadsPage({ searchParams }: OlympiadsPageProps) {
  const [olympiads, setOlympiads] = useState<Olympiad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState(searchParams.subject || '');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => { fetchOlympiads(); fetchSubjects(); }, 300);
    return () => clearTimeout(timer);
  }, [selectedSubject, searchQuery]);

  const fetchOlympiads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedSubject) params.append('subject', selectedSubject);
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', '1');
      params.append('limit', '20');

      const res = await api.get(`/olympiads?${params.toString()}`);
      const olympiadData = res.data?.data || res.data;
      setOlympiads(Array.isArray(olympiadData) ? olympiadData : olympiadData?.data || []);
    } catch (err) {
      console.error('Olympiads fetch error:', err);
      setError('Olimpiadalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/olympiads/subjects');
      const d = res.data?.data ?? res.data; setSubjects(Array.isArray(d) ? d : []);
    } catch (err) {
      console.error('Subjects fetch error:', err);
      toast({ title: 'Xatolik', description: 'Fanlarni yuklashda xatolik', variant: 'error' });
    }
  };

  const activeOlympiads = olympiads.filter(o => o.isActive && new Date(o.regEndDate) > new Date());
  const upcomingOlympiads = olympiads.filter(o => o.isActive && new Date(o.examDate) > new Date());
  const pastOlympiads = olympiads.filter(o => new Date(o.examDate) < new Date());

  return (
    <div className="space-y-6">
      <title>Olimpiadalar — Olimpiy</title>
      <meta name="description" content="Barcha olimpiadalar ro'yxati." />
      {/* Header */}
      <div className="glass-card p-6 lg:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white">
            Olimpiadalar
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Faol va yaqinlashayotgan olimpiadalar ro'yxati
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card variant="strong" className="border border-white/40 dark:border-white/[0.06] shadow-apple-lg">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Olimpiada nomi, fan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11"
              />
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Fan tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Barcha fanlar</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Olympiads Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="card-hover"><CardContent className="h-48"><Skeleton className="h-full" /></CardContent></Card>
          ))}
        </div>
      ) : error ? (
        <Card className="text-center py-12 border-red-200 dark:border-red-800">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <span className="text-2xl">⚠</span>
          </div>
          <h3 className="font-display font-semibold text-xl text-slate-900 dark:text-white mb-2">
            Yuklashda xatolik
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {error}
          </p>
          <Button onClick={() => { setError(null); setLoading(true); fetchOlympiads(); }}>
            Qayta urinish
          </Button>
        </Card>
      ) : activeOlympiads.length === 0 && upcomingOlympiads.length === 0 ? (
        <Card className="text-center py-12 gradient-border bg-white/60 backdrop-blur-xl border-white/40 shadow-sm dark:bg-dark-card/60">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
          <h3 className="font-display font-semibold text-xl text-slate-900 dark:text-white mb-2">
            Olimpiadalar topilmadi
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Hozircha faol olimpiadalar yo'q. Filtrlarni o'zgartiring yoki keyinroq qayta urinib ko'ring.
          </p>
        </Card>
      ) : (
        <>
          {activeOlympiads.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary-600" />
                  Ro'yxatdan o'tish ochiq
                </h2>
                <Badge variant="success" className="text-sm">
                  {activeOlympiads.length} ta
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeOlympiads.map((olympiad) => (
                  <OlympiadCard key={olympiad.id} olympiad={olympiad} showRegister={true} />
                ))}
              </div>
            </section>
          )}

          {upcomingOlympiads.length > 0 && (
            <section className="space-y-4 mt-8">
              <h2 className="font-display font-semibold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-secondary-500" />
                Yaqinlashayotgan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingOlympiads.slice(0, 6).map((olympiad) => (
                  <OlympiadCard key={olympiad.id} olympiad={olympiad} />
                ))}
              </div>
            </section>
          )}

          {pastOlympiads.length > 0 && (
            <section className="space-y-4 mt-8">
              <h2 className="font-display font-semibold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-slate-500" />
                O'tgan olimpiadalar
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastOlympiads.slice(0, 6).map((olympiad) => (
                  <OlympiadCard key={olympiad.id} olympiad={olympiad} past={true} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function OlympiadCard({ olympiad, showRegister = false, past = false }: { olympiad: Olympiad; showRegister?: boolean; past?: boolean }) {
  const isRegistrationOpen = new Date(olympiad.regEndDate) > new Date() && olympiad.isActive;
  const daysLeft = Math.ceil((new Date(olympiad.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isPast = past || new Date(olympiad.examDate) < new Date();

  // Create a consistent gradient based on subject name length
  const gradients = [
    'from-blue-600 via-indigo-700 to-blue-900',
    'from-emerald-500 via-teal-600 to-emerald-900',
    'from-violet-600 via-purple-700 to-violet-900',
    'from-rose-500 via-pink-600 to-rose-900',
    'from-amber-500 via-orange-600 to-amber-900'
  ];
  const gradientClass = gradients[olympiad.subject.length % gradients.length];

  return (
    <Card variant="strong" className={cn('group overflow-hidden border border-white/40 dark:border-white/[0.06] shadow-apple-lg hover:shadow-apple-xl transition-all duration-500 hover:-translate-y-1', isPast && 'opacity-70')}>
      {/* Header Image/Gradient Area */}
      <div className={`relative h-40 bg-gradient-to-br ${gradientClass} overflow-hidden`}>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] bg-[length:20px_20px]" />
        
        {/* Inner glow effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        
        <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
          <div className="flex items-start justify-between">
            <div className="flex gap-2">
              <span className="text-xs font-semibold tracking-wide uppercase bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full shadow-sm">
                {olympiad.subject}
              </span>
            </div>
            {isPast ? (
              <span className="text-xs font-semibold bg-slate-500/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-slate-400/30">Tugagan</span>
            ) : isRegistrationOpen ? (
              <span className="text-xs font-semibold bg-emerald-500/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.4)]">Ochiq</span>
            ) : (
              <span className="text-xs font-semibold bg-amber-500/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-amber-400/30">Yopiq</span>
            )}
          </div>
          
          {olympiad.maxCapacity && (
            <div className="flex items-center gap-2 mt-auto">
              <div className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(100, ((olympiad._count?.registrations || 0) / olympiad.maxCapacity) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium bg-black/30 backdrop-blur-md px-2 py-1 rounded-md">
                {olympiad._count?.registrations || 0} / {olympiad.maxCapacity} o'rin
              </span>
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-6">
        <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-4 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {olympiad.title}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-sm text-slate-600 dark:text-slate-400 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(olympiad.examDate)}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
              <Clock className="w-4 h-4" />
            </div>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {daysLeft > 0 ? `${daysLeft} kun qoldi` : isPast ? 'Tugagan' : 'Bugun'}
            </span>
          </div>
          <div className="flex items-center gap-2.5 sm:col-span-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
              <MapPin className="w-4 h-4" />
            </div>
            <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
              {olympiad.locations?.[0]?.location?.name || 'Bino belgilanmagan'}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800 gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Narxi</span>
            <span className="font-display font-bold text-xl text-slate-900 dark:text-white leading-none">
              {formatPrice(Number(olympiad.price))}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {showRegister && isRegistrationOpen && !isPast && (
              <Button asChild size="sm" className="flex-1 sm:flex-none shadow-md shadow-primary-500/20">
                <a href={`/dashboard/registrations/create?olympiad=${olympiad.id}`}>Ro'yxatdan o'tish</a>
              </Button>
            )}
            <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700">
              <Link href={`/dashboard/olympiads/${olympiad.id}`}>Batafsil</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}