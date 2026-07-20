'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { formatDateTime, getStatusColor, getStatusLabel } from '@/lib/utils';

export default function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [olympiads, setOlympiads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    olympiadId: '',
    status: '',
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    fetchRegistrations();
  }, [searchQuery, filters.olympiadId, filters.status, pagination.page]);

  useEffect(() => {
    fetchOlympiads();
  }, []);

  const fetchOlympiads = async () => {
    try {
      const res = await api.olympiads.getAll({ page: 1, limit: 50 });
      let arr = [];
      if (Array.isArray(res.data?.data?.data)) arr = res.data.data.data;
      else if (Array.isArray(res.data?.data)) arr = res.data.data;
      else if (Array.isArray(res.data)) arr = res.data;
      setOlympiads(arr);
    } catch {
      toast({ title: 'Xatolik', description: 'Ma\'lumotlarni yuklashda xatolik', variant: 'error' });
    }
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filters.olympiadId && filters.olympiadId !== 'all_items') params.append('olympiadId', filters.olympiadId);
      if (filters.status && filters.status !== 'all_items') params.append('status', filters.status);
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
      
      const res = await api.get(`/admin/registrations?${params.toString()}`);
      
      let arr = [];
      if (Array.isArray(res.data?.data?.data)) arr = res.data.data.data;
      else if (Array.isArray(res.data?.data)) arr = res.data.data;
      else if (Array.isArray(res.data)) arr = res.data;
      else if (res.data?.data?.items && Array.isArray(res.data.data.items)) arr = res.data.data.items;
      
      let metaObj = { total: 0, page: 1, limit: 20, totalPages: 0 };
      if (res.data?.data?.meta) metaObj = res.data.data.meta;
      else if (res.data?.meta) metaObj = res.data.meta;
      
      setRegistrations(arr);
      setPagination(metaObj);
    } catch (err: unknown) {
      toast({ title: 'Xatolik', description: err instanceof Error ? err.message : 'Xatolik yuz berdi', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const olympiadId = filters.olympiadId !== 'all_items' ? filters.olympiadId : '';
      const res = await api.admin.exportRegistrations(olympiadId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `registrations-${Date.now()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ title: 'Muvaffaqiyatli', description: 'Fayl yuklab olindi', variant: 'success' });
    } catch {
      toast({ title: 'Xatolik', description: 'Eksport qilishda xatolik', variant: 'error' });
    }
  };



  return (
    <div className="space-y-6">
      <title>Arizalar — Olimpiy Admin</title>
      <meta name="description" content="Barcha arizalar ro'yxati va boshqaruvi." />
      <div className="flex items-center gap-4">
        <Link href="/admin"><Button variant="outline" size="icon" aria-label="Orqaga"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white">Arizalar</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Olimpiada uchun kelib tushgan barcha arizalar</p>
        </div>
      </div>

      <Card className="gradient-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input placeholder="F.I.O, telefon, maktab..." value={searchInput} onChange={e => setSearchInput(e.target.value)} className="max-w-md" />
            </div>
            <Select value={filters.olympiadId} onValueChange={v => setFilters({...filters, olympiadId: v})}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Olimpiada" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all_items">Barchasi</SelectItem>
                {olympiads.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={v => setFilters({...filters, status: v})}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Holat" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all_items">Barchasi</SelectItem>
                <SelectItem value="PENDING">Kutilmoqda</SelectItem>
                <SelectItem value="PAID">To'langan</SelectItem>
                <SelectItem value="CANCELLED">Bekor qilingan</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport} disabled={loading}>
              <Download className="w-4 h-4 mr-2" /> Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card><div className="p-6 space-y-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div></Card>
      ) : (
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>№</TableHead>
                <TableHead>F.I.O</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Olimpiada</TableHead>
                <TableHead>Bino/Xona</TableHead>
                <TableHead>Parta</TableHead>
                <TableHead>Til</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>To'lov</TableHead>
                <TableHead>Sana</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-slate-500">
                    Arizalar topilmadi
                  </TableCell>
                </TableRow>
              )}
              {registrations.map((reg: any, i: number) => (
                <TableRow key={reg.id}>
                  <TableCell>{(pagination.page - 1) * pagination.limit + i + 1}</TableCell>
                  <TableCell className="font-medium">{reg.user?.fullName}</TableCell>
                  <TableCell>{reg.user?.phoneNumber}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{reg.olympiad?.title}</TableCell>
                  <TableCell>{reg.location?.name} / {reg.room?.roomNumber}</TableCell>
                  <TableCell className="text-center">{reg.seatNumber}</TableCell>
                  <TableCell className="capitalize">{reg.lang}</TableCell>
                  <TableCell><Badge variant={getStatusColor(reg.status)}>{getStatusLabel(reg.status)}</Badge></TableCell>
                  <TableCell><Badge variant={reg.payment?.status === 'SUCCESS' ? 'success' : 'warning'}>{reg.payment?.status || 'YO\'Q'}</Badge></TableCell>
                  <TableCell className="text-slate-500 dark:text-slate-400 text-sm">{formatDateTime(reg.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      )}

      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-slate-600 dark:text-slate-400">Jami: {pagination.total} ta</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPagination((p: typeof pagination) => ({...p, page: p.page - 1}))} disabled={pagination.page <= 1}>Oldingi</Button>
          <span className="px-3 text-sm flex items-center">Sahifa {pagination.page} / {pagination.totalPages || 1}</span>
          <Button variant="outline" size="sm" onClick={() => setPagination((p: typeof pagination) => ({...p, page: p.page + 1}))} disabled={pagination.page >= pagination.totalPages}>Keyingi</Button>
        </div>
      </div>
    </div>
  );
}
