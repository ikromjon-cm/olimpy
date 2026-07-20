'use client';


import { useEffect, useState } from 'react';
import { Trophy, Award, Download, CheckCircle } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import { api } from '@/lib/api';
import { Result } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth';

interface ResultsPageProps {
  searchParams: { olympiadId?: string; page?: string };
}

export default function ResultsPage({ searchParams }: ResultsPageProps) {
  const { user } = useAuthStore();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
  const [filters, setFilters] = useState({
    olympiadId: searchParams.olympiadId || '',
    minScore: '',
    maxScore: '',
    hasCertificate: '',
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchResults();
  }, [activeTab, filters, pagination.page]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab === 'my') {
        params.append('my', 'true');
      } else {
        if (filters.olympiadId) params.append('olympiadId', filters.olympiadId);
        if (filters.minScore) params.append('minScore', filters.minScore);
        if (filters.maxScore) params.append('maxScore', filters.maxScore);
        if (filters.hasCertificate) params.append('hasCertificate', filters.hasCertificate);
      }
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const query = params.toString();
      const res = await api.get(`/results${query ? `?${query}` : ''}`);
      const resData = res.data?.data || res.data;
      setResults(Array.isArray(resData) ? resData : []);
    } catch {
      console.error('Results fetch error:');
      toast({ title: 'Xatolik', description: 'Natijalarni yuklashda xatolik', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.admin.exportRegistrations(filters.olympiadId || '');
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `results-${Date.now()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Xatolik', description: 'Eksport qilishda xatolik', variant: 'error' });
    }
  };

  const safeResults = Array.isArray(results) ? results : [];
  const myResults = safeResults.filter(r => r.registration?.userId === user?.id);
  const hasResults = activeTab === 'my' ? myResults.length > 0 : safeResults.length > 0;

  return (
    <div className="space-y-6">
      <title>Natijalar — Olimpiy</title>
      <meta name="description" content="Olimpiada natijalari, ballar va sertifikatlar." />
      <div className="glass-card p-6 lg:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white">Natijalar</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Olimpiada natijalari, ballar va sertifikatlar
          </p>
        </div>
        {activeTab === 'all' && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={loading} className="shadow-sm">
              <Download className="w-4 h-4 mr-2" />
              Excel eksport
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'my' | 'all')} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 p-1.5 bg-white/50 dark:bg-white/[0.04] backdrop-blur-2xl rounded-2xl border border-white/30 dark:border-white/[0.06]">
          <TabsTrigger value="my" className="rounded-xl text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-white/[0.08] data-[state=active]:shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-all duration-300">Mening natijalarim</TabsTrigger>
          {user?.role === 'ADMIN' && <TabsTrigger value="all" className="rounded-xl text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-white/[0.08] data-[state=active]:shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-all duration-300">Barcha natijalar (Admin)</TabsTrigger>}
        </TabsList>

        <TabsContent value="my">
          <MyResultsContent results={myResults} loading={loading} />
        </TabsContent>

        {user?.role === 'ADMIN' && (
          <TabsContent value="all">
            <AllResultsContent results={results} loading={loading} filters={filters} setFilters={setFilters} pagination={pagination} setPagination={setPagination} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function MyResultsContent({ results, loading }: { results: Result[]; loading: boolean }) {
  if (loading) {
    return <div className="space-y-4">{[...Array(5)].map((_, i) => (<Skeleton key={i} className="h-20" />))}</div>;
  }

  if (results.length === 0) {
    return (
      <Card className="text-center py-12 gradient-border">
        <Award className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
        <h3 className="font-display font-semibold text-xl text-slate-900 dark:text-white mb-2">Natijalar yo'q</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">Siz hali hech qanday olimpiada natijasi ega emassiz</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <ResultCard key={result.id} result={result} />
      ))}
    </div>
  );
}

function AllResultsContent({ results, loading, filters, setFilters, pagination, setPagination }: {
  results: Result[]; loading: boolean;
  filters: { olympiadId: string; minScore: string; maxScore: string; hasCertificate: string };
  setFilters: React.Dispatch<React.SetStateAction<{ olympiadId: string; minScore: string; maxScore: string; hasCertificate: string }>>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
  setPagination: React.Dispatch<React.SetStateAction<{ page: number; limit: number; total: number; totalPages: number }>>;
}) {
  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-4">
      <Card className="gradient-border">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Select value={filters.olympiadId} onValueChange={v => setFilters({...filters, olympiadId: v})}>
              <SelectTrigger><SelectValue placeholder="Olimpiada" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Barchasi</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Min ball" value={filters.minScore} onChange={e => setFilters({...filters, minScore: e.target.value})} type="number" />
            <Input placeholder="Max ball" value={filters.maxScore} onChange={e => setFilters({...filters, maxScore: e.target.value})} type="number" />
            <Select value={filters.hasCertificate} onValueChange={v => setFilters({...filters, hasCertificate: v})}>
              <SelectTrigger><SelectValue placeholder="Sertifikat" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Barchasi</SelectItem>
                <SelectItem value="true">Bor</SelectItem>
                <SelectItem value="false">Yo'q</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>F.I.O</TableHead>
              <TableHead>Olimpiada</TableHead>
              <TableHead>Ball</TableHead>
              <TableHead>O'rin</TableHead>
              <TableHead>Sertifikat</TableHead>
              <TableHead>Sana</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((result: Result) => (
              <TableRow key={result.id}>
                <TableCell className="font-medium">{result.registration?.user?.fullName}</TableCell>
                <TableCell>{result.registration?.olympiad?.title}</TableCell>
                <TableCell className="font-semibold text-lg text-primary-600 dark:text-primary-400">{result.score}</TableCell>
                <TableCell>{result.rank ? `#${result.rank}` : '-'}</TableCell>
                <TableCell>
                  {result.certificateUrl ? (
                    <Badge variant="success" className="cursor-pointer">
                      <CheckCircle className="w-3 h-3 mr-1" /> Mavjud
                    </Badge>
                  ) : (
                    <Badge variant="default">Yo'q</Badge>
                  )}
                </TableCell>
                <TableCell className="text-slate-500 dark:text-slate-400">{formatDateTime(result.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          Jami: {pagination.total} ta natija
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPagination((p: typeof pagination) => ({...p, page: p.page - 1}))} disabled={pagination.page === 1}>
            Oldingi
          </Button>
          <span className="px-3 text-sm">Sahifa {pagination.page} / {pagination.totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPagination((p: typeof pagination) => ({...p, page: p.page + 1}))} disabled={pagination.page === pagination.totalPages}>
            Keyingi
          </Button>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: Result }) {
  const reg = result.registration;
  const isPast = reg?.olympiad && new Date(reg.olympiad.examDate) < new Date();

  return (
    <Card variant="strong" className="border border-white/40 dark:border-white/[0.06] shadow-apple-lg hover:shadow-apple-xl transition-all duration-300 hover:-translate-y-0.5">
      <CardContent className="p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center text-white shadow-[0_8px_24px_rgba(99,102,241,0.3)]">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-xl tracking-tight text-slate-900 dark:text-white">
                {reg?.olympiad?.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {reg?.olympiad?.subject} • {formatDate(reg?.olympiad?.examDate || '')}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="text-center p-4 rounded-2xl bg-white/50 dark:bg-white/[0.04] backdrop-blur-xl border border-white/30 dark:border-white/[0.06] min-w-[100px]">
                <p className="font-display font-bold text-3xl tracking-tight text-primary-600 dark:text-primary-400">{result.score}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ball</p>
              </div>
              {result.rank && (
                <div className="text-center p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 min-w-[100px]">
                  <p className="font-display font-bold text-3xl tracking-tight text-amber-600 dark:text-amber-400">#{result.rank}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">O'rin</p>
                </div>
              )}
            </div>

            <div className="flex flex-row sm:flex-col items-center gap-2">
              {result.certificateUrl && (
                <Button asChild variant="secondary" size="sm" className="shadow-sm">
                  <a href={result.certificateUrl} target="_blank" rel="noopener noreferrer">
                    <Award className="w-4 h-4 mr-1" /> Sertifikat
                  </a>
                </Button>
              )}
              <Badge variant={isPast ? 'default' : 'success'}>{isPast ? 'Tugagan' : 'Faol'}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            {[...Array(6)].map((_, i) => <TableHead key={i}><Skeleton className="h-4 w-24" /></TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              {[...Array(6)].map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}