'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Plus, Pencil, Trash2, MapPin, Phone, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLocations(); }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getLocations();
      
      let arr = [];
      if (Array.isArray(res.data?.data?.data)) arr = res.data.data.data;
      else if (Array.isArray(res.data?.data)) arr = res.data.data;
      else if (Array.isArray(res.data)) arr = res.data;
      
      setLocations(arr);
    } catch (err) { console.error(err); toast({ title: 'Xatolik', description: 'Binolar ro\'yxatini yuklashda xatolik', variant: 'error' }); }
    finally { setLoading(false); }
  };

  const deleteLocation = async (id: string) => {
    try {
      await api.admin.deleteLocation(id);
      toast({ title: 'Bino o\'chirildi' });
      fetchLocations();
    } catch (err: unknown) { toast({ title: 'Xatolik', variant: 'error', description: err instanceof Error ? err.message : 'Xatolik yuz berdi' }); }
  };

  return (
    <div className="space-y-6">
      <title>Binolar — Olimpiy Admin</title>
      <meta name="description" content="Binolar va xonalar ro'yxati." />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin"><Button variant="outline" size="icon" aria-label="Orqaga"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white">Binolar va xonalar</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Barcha binolar va ularning xonalari ro'yxati</p>
          </div>
        </div>
        <Link href="/admin/locations/create"><Button><Plus className="w-4 h-4 mr-2" />Yangi bino</Button></Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : locations.length === 0 ? (
        <Card className="gradient-border">
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            <h3 className="font-display font-semibold text-xl text-slate-900 dark:text-white mb-2">Bino mavjud emas</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Hali hech qanday bino qo'shilmagan</p>
            <Link href="/admin/locations/create"><Button><Plus className="w-4 h-4 mr-2" />Bino qo'shish</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {locations.map((loc) => (
            <Card key={loc.id} className="card-hover flex flex-col">
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-white truncate">{loc.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3 shrink-0" />{loc.address}</p>
                  </div>
                  <Badge variant="info">{loc._count?.rooms || 0} xona</Badge>
                </div>
                {loc.contactPerson && <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-2 flex-1"><Phone className="w-3 h-3 shrink-0" />{loc.contactPerson} {loc.contactPhone ? `(${loc.contactPhone})` : ''}</p>}
                <div className="flex items-center justify-end gap-2 mt-auto pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                  <Link href={`/admin/locations/${loc.id}`}>
                    <Button variant="outline" size="sm"><Pencil className="w-3 h-3 mr-1" />Tahrirlash</Button>
                  </Link>
                  <Button variant="danger" size="sm" onClick={() => deleteLocation(loc.id)}><Trash2 className="w-3 h-3 mr-1" />O'chirish</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
