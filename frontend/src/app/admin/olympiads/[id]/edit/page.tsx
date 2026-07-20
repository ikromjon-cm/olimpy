'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { validatePositiveNumber, validateDateOrder } from '@/lib/utils';

export default function EditOlympiadPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    price: '',
    examDate: '',
    regEndDate: '',
    maxCapacity: '',
  });

  useEffect(() => {
    if (id) fetchOlympiad();
  }, [id]);

  const fetchOlympiad = async () => {
    try {
      const res = await api.olympiads.getOneAdmin(id as string);
      const o = res.data?.data || res.data;
      setFormData({
        title: o.title || '',
        subject: o.subject || '',
        description: o.description || '',
        price: String(o.price || ''),
        examDate: o.examDate ? o.examDate.slice(0, 16) : '',
        regEndDate: o.regEndDate ? o.regEndDate.slice(0, 16) : '',
        maxCapacity: o.maxCapacity ? String(o.maxCapacity) : '',
      });
    } catch (err: unknown) {
      toast({ title: 'Xatolik', description: err instanceof Error ? err.message : 'Xatolik yuz berdi', variant: 'error' });
      router.push('/admin/olympiads');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const next = { ...prev }; delete next[name]; return next; });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const priceErr = validatePositiveNumber(formData.price, 'Narx');
    if (priceErr) errs.price = priceErr;
    const dateErr = validateDateOrder(formData.regEndDate, formData.examDate, "Ro'yxatdan o'tish tugash sanasi", "Imtihon sanasi");
    if (dateErr) errs.regEndDate = dateErr;
    if (formData.maxCapacity) {
      const capErr = validatePositiveNumber(formData.maxCapacity, "Maksimal sig'im");
      if (capErr) errs.maxCapacity = capErr;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await api.olympiads.update(id as string, {
        ...formData,
        price: Number(formData.price),
        maxCapacity: formData.maxCapacity ? Number(formData.maxCapacity) : null,
        examDate: new Date(formData.examDate).toISOString(),
        regEndDate: new Date(formData.regEndDate).toISOString(),
      });
      toast({ title: "Olimpiada yangilandi", variant: 'success' });
      router.push('/admin/olympiads');
    } catch (err: unknown) {
      toast({ title: 'Xatolik', description: err instanceof Error ? err.message : 'Xatolik yuz berdi', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-1/4" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <title>Olimpiadani tahrirlash — Olimpiy Admin</title>
      <meta name="description" content="Olimpiadani tahrirlash." />
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Orqaga">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-display font-bold text-2xl">Olimpiadani tahrirlash</h1>
          <p className="text-slate-500">Olimpiada ma'lumotlarini o'zgartiring</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Sarlavha</label>
                <Input id="title" name="title" required value={formData.title} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">Fan</label>
                <Input id="subject" name="subject" required value={formData.subject} onChange={handleChange} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="description" className="text-sm font-medium">Tavsif (ixtiyoriy)</label>
                <textarea 
                  id="description"
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="price" className="text-sm font-medium">Narxi (so'm)</label>
                <Input id="price" type="number" name="price" required min="0" value={formData.price} onChange={handleChange} />
                {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="maxCapacity" className="text-sm font-medium">Maksimal sig'im (ixtiyoriy)</label>
                <Input id="maxCapacity" type="number" name="maxCapacity" min="0" value={formData.maxCapacity} onChange={handleChange} />
                {errors.maxCapacity && <p className="text-sm text-red-500">{errors.maxCapacity}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="examDate" className="text-sm font-medium">Imtihon sanasi va vaqti</label>
                <Input id="examDate" type="datetime-local" name="examDate" required value={formData.examDate} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label htmlFor="regEndDate" className="text-sm font-medium">Ro'yxatdan o'tish tugash sanasi</label>
                <Input id="regEndDate" type="datetime-local" name="regEndDate" required value={formData.regEndDate} onChange={handleChange} />
                {errors.regEndDate && <p className="text-sm text-red-500">{errors.regEndDate}</p>}
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <Link href="/admin/olympiads"><Button variant="outline">Bekor qilish</Button></Link>
              <Button type="submit" disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                Saqlash
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
