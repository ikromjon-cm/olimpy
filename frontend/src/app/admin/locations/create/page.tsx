'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

export default function CreateLocationPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', address: '', contactPerson: '', contactPhone: '', mapLink: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.admin.createLocation(form);
      toast({ title: 'Muvaffaqiyatli', description: 'Bino yaratildi', variant: 'success' });
      router.push('/admin/locations');
    } catch (err: unknown) { toast({ title: 'Xatolik', description: err instanceof Error ? err.message : 'Xatolik yuz berdi', variant: 'error' }); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <title>Yangi bino — Olimpiy Admin</title>
      <meta name="description" content="Yangi bino qo'shish." />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white">Yangi bino qo'shish</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Bino va xonalar ma'lumotlarini kiriting</p>
        </div>
        <Link href="/admin/locations"><Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Orqaga</Button></Link>
      </div>

      <Card className="max-w-2xl gradient-border">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Bino nomi *" placeholder="Masalan: 1-maktab" required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
            <Input label="Manzil *" placeholder="To'liq manzil" required value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Aloqa shaxsi" placeholder="To'liq ism" value={form.contactPerson} onChange={e => setForm(p => ({...p, contactPerson: e.target.value}))} />
              <Input label="Telefon raqam" placeholder="+998 XX XXX XX XX" value={form.contactPhone} onChange={e => setForm(p => ({...p, contactPhone: e.target.value}))} />
            </div>
            <Input label="Xarita linki" placeholder="Google Maps yoki Yandex Maps linki" value={form.mapLink} onChange={e => setForm(p => ({...p, mapLink: e.target.value}))} />
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link href="/admin/locations"><Button variant="outline">Bekor qilish</Button></Link>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
