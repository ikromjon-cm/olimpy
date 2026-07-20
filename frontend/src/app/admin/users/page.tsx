'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  useEffect(() => { fetchUsers(); }, [page, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (roleFilter && roleFilter !== 'ALL') params.role = roleFilter;
      if (search) params.search = search;
      const res = await api.admin.getUsers(params);
      
      let arr = [];
      if (Array.isArray(res.data?.data?.data)) arr = res.data.data.data;
      else if (Array.isArray(res.data?.data)) arr = res.data.data;
      else if (Array.isArray(res.data)) arr = res.data;
      
      let metaObj = { total: 0, page: 1, limit: 20, totalPages: 0 };
      if (res.data?.data?.meta) metaObj = res.data.data.meta;
      else if (res.data?.meta) metaObj = res.data.meta;
      
      setUsers(arr);
      setMeta(metaObj);
    } catch (err) { console.error('Users fetch error:', err); toast({ title: 'Xatolik', description: 'Foydalanuvchilarni yuklashda xatolik', variant: 'error' }); }
    finally { setLoading(false); }
  };

  const toggleStatus = async (userId: string) => {
    try {
      await api.admin.toggleUserStatus(userId);
      toast({ title: 'Holat o\'zgartirildi' });
      fetchUsers();
    } catch (err: unknown) { toast({ title: 'Xatolik', description: err instanceof Error ? err.message : 'Xatolik yuz berdi', variant: 'error' }); }
  };

  return (
    <div className="space-y-6">
      <title>Foydalanuvchilar — Olimpiy Admin</title>
      <meta name="description" content="Foydalanuvchilar ro'yxati va boshqaruvi." />
      <div className="flex items-center gap-4">
        <Link href="/admin"><Button variant="outline" size="icon" aria-label="Orqaga"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <h1 className="font-display font-bold text-2xl">Foydalanuvchilar</h1>
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers()} />
              <Button variant="outline" onClick={fetchUsers} aria-label="Qidirish"><Search className="w-4 h-4" /></Button>
            </div>
            <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Barcha rollar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Barchasi</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="PROCTOR">Proktor</SelectItem>
                <SelectItem value="STUDENT">O'quvchi</SelectItem>
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
              <TableHead>Telefon</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Maktab</TableHead>
              <TableHead>Sinf</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead>Arizalar</TableHead>
              <TableHead>Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>)
            : users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.fullName || 'Noma\'lum'}</TableCell>
                <TableCell>{u.phoneNumber}</TableCell>
                <TableCell><Badge variant={u.role === 'ADMIN' ? 'default' : u.role === 'PROCTOR' ? 'secondary' : 'info'}>{u.role}</Badge></TableCell>
                <TableCell className="max-w-[150px] truncate">{u.schoolName || '-'}</TableCell>
                <TableCell>{u.grade || '-'}</TableCell>
                <TableCell><Badge variant={u.isActive ? 'success' : 'error'}>{u.isActive ? 'Faol' : 'Bloklangan'}</Badge></TableCell>
                <TableCell>{u._count?.registrations || 0}</TableCell>
                <TableCell><Button variant="outline" size="sm" onClick={() => toggleStatus(u.id)}>{u.isActive ? 'Bloklash' : 'Faollashtirish'}</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">Jami: {meta.total} ta</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} aria-label="Oldingi sahifa"><ChevronLeft className="w-4 h-4" /></Button>
          <span className="px-3 text-sm self-center">Sahifa {meta.page} / {meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)} aria-label="Keyingi sahifa"><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
}
