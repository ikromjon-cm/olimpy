'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Calendar, DollarSign, Users, Plus, Loader2, ArrowLeft, Trash2, Pencil } from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

export default function AdminOlympiadsPage() {
  const [olympiads, setOlympiads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { fetchOlympiads(); }, []);
  useEffect(() => { const t = setTimeout(() => setSearchQuery(search), 300); return () => clearTimeout(t); }, [search]);

  const fetchOlympiads = async (q?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: 1, limit: 100 };
      if (q) params.search = q;
      const res = await api.olympiads.getAllAdmin(params);
      
      let arr = [];
      if (Array.isArray(res.data?.data?.data)) arr = res.data.data.data;
      else if (Array.isArray(res.data?.data)) arr = res.data.data;
      else if (Array.isArray(res.data)) arr = res.data;
      
      setOlympiads(arr);
    } catch (err) { console.error(err); toast({ title: 'Xatolik', description: 'Olimpiadalarni yuklashda xatolik', variant: 'error' }); }
    finally { setLoading(false); }
  };

  const toggleActive = async (id: string) => {
    setToggling(id);
    try {
      await api.olympiads.toggleActive(id);
      toast({ title: 'Holat o\'zgartirildi' });
      fetchOlympiads(searchQuery);
    } catch (err: unknown) { toast({ title: 'Xatolik', description: err instanceof Error ? err.message : 'Xatolik yuz berdi', variant: 'error' }); }
    finally { setToggling(null); }
  };

  const deleteOlympiad = async (id: string) => {
    if (!confirm('Olimpiadani o\'chirishni tasdiqlaysizmi?')) return;
    setDeleting(id);
    try {
      await api.olympiads.delete(id);
      toast({ title: 'Olimpiada o\'chirildi' });
      fetchOlympiads(searchQuery);
    } catch (err: unknown) { toast({ title: 'Xatolik', description: err instanceof Error ? err.message : 'Xatolik yuz berdi', variant: 'error' }); }
    finally { setDeleting(null); }
  };

  useEffect(() => {
    if (!searchQuery) { fetchOlympiads(); return; }
    const t = setTimeout(() => fetchOlympiads(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filtered = olympiads.filter(o =>
    !searchQuery || o.title.toLowerCase().includes(searchQuery.toLowerCase()) || o.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <title>Olimpiadalar — Olimpiy Admin</title>
      <meta name="description" content="Olimpiadalar ro'yxati va boshqaruvi." />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin"><Button variant="outline" size="icon" aria-label="Orqaga"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white">Olimpiadalar</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Barcha olimpiadalar ro'yxati va boshqaruvi</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
          <Link href="/admin/olympiads/create"><Button><Plus className="w-4 h-4 mr-2" />Yangi</Button></Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-5 w-3/4 mb-3" /><Skeleton className="h-4 w-1/2 mb-3" /><Skeleton className="h-4 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="gradient-border">
          <CardContent className="p-12 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="font-display font-semibold text-xl text-slate-900 dark:text-white mb-2">Olimpiada mavjud emas</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Hali hech qanday olimpiada qo'shilmagan</p>
            <Link href="/admin/olympiads/create"><Button><Plus className="w-4 h-4 mr-2" />Birinchi olimpiadani yaratish</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((o) => (
            <Card key={o.id} className="card-hover flex flex-col">
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/olympiads/${o.id}`} className="font-display font-semibold text-base text-slate-900 dark:text-white truncate hover:text-primary-600 transition-colors block">
                      {o.title}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{o.subject}</p>
                  </div>
                  <Badge variant={o.isActive ? 'success' : 'default'} className="shrink-0 ml-2">{o.isActive ? 'Faol' : 'Nofaol'}</Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 mb-3">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(o.examDate)}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatPrice(Number(o.price))}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{o._count?.registrations || 0}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-200/50 dark:border-slate-800/50 mt-auto">
                  <div className="flex gap-1">
                    <Link href={`/admin/olympiads/${o.id}/edit`}><Button variant="ghost" size="sm" aria-label="Tahrirlash"><Pencil className="w-3 h-3" /></Button></Link>
                    <Button variant="ghost" size="sm" disabled={deleting === o.id} onClick={() => deleteOlympiad(o.id)} className="text-red-500 hover:text-red-700" aria-label="O'chirish">
                      {deleting === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </Button>
                  </div>
                  <Button variant={o.isActive ? 'secondary' : 'outline'} size="sm" disabled={toggling === o.id} onClick={() => toggleActive(o.id)} className="text-xs px-3 py-1 h-auto">
                    {toggling === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    {o.isActive ? 'To\'xtatish' : 'Faollashtirish'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
