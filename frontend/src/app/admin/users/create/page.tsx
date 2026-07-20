'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, User, Phone, Lock, GraduationCap } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { isValidPhone } from '@/lib/utils';

export default function CreateUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    fullName: '', phoneNumber: '', password: '', role: 'STUDENT',
    schoolName: '', grade: '', region: '', district: '', parentPhone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => { const next = { ...prev }; delete next[name]; return next; });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!isValidPhone(form.phoneNumber)) errs.phoneNumber = 'Telefon raqam formati noto\'g\'ri';
    if (form.password.length < 6) errs.password = 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak';
    if (form.grade) {
      const g = Number(form.grade);
      if (isNaN(g) || g < 1 || g > 11) errs.grade = 'Sinf 1-11 oralig\'ida bo\'lishi kerak';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/admin/users', {
        ...form,
        grade: form.grade ? Number(form.grade) : undefined,
        phoneNumber: form.phoneNumber.replace(/\D/g, ''),
      });
      toast({ title: 'Foydalanuvchi qo\'shildi', variant: 'success' });
      router.push('/admin/users');
    } catch (err: unknown) {
      toast({ title: 'Xatolik', description: err instanceof Error ? err.message : 'Xatolik yuz berdi', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <title>Yangi foydalanuvchi — Olimpiy Admin</title>
      <meta name="description" content="Yangi foydalanuvchi qo'shish." />
      <div className="flex items-center gap-4">
        <Link href="/admin/users"><Button variant="outline" size="icon" aria-label="Orqaga"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div>
          <h1 className="font-display font-bold text-2xl">Yangi foydalanuvchi</h1>
          <p className="text-slate-500">Foydalanuvchi ma'lumotlarini kiriting</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium text-slate-700 dark:text-slate-300">F.I.O</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input id="fullName" required name="fullName" className="pl-10" placeholder="Eshmatov Toshmat" value={form.fullName} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefon raqam</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input id="phoneNumber" required name="phoneNumber" className="pl-10" placeholder="+998 90 123 45 67" value={form.phoneNumber} onChange={handleChange} />
                  {errors.phoneNumber && <p className="text-sm text-red-500">{errors.phoneNumber}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium text-slate-700 dark:text-slate-300">Rol</label>
                <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">O'quvchi</SelectItem>
                    <SelectItem value="PROCTOR">Nazoratchi</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">Parol</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input id="password" required name="password" type="password" minLength={6} className="pl-10" placeholder="Kamida 6 belgi" value={form.password} onChange={handleChange} />
                  {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="schoolName" className="text-sm font-medium text-slate-700 dark:text-slate-300">Maktab</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input id="schoolName" name="schoolName" className="pl-10" placeholder="1-sonli maktab" value={form.schoolName} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="grade" className="text-sm font-medium text-slate-700 dark:text-slate-300">Sinf</label>
                <Input id="grade" name="grade" type="number" min="1" max="11" placeholder="10" value={form.grade} onChange={handleChange} />
                {errors.grade && <p className="text-sm text-red-500">{errors.grade}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="region" className="text-sm font-medium text-slate-700 dark:text-slate-300">Viloyat</label>
                <Input id="region" name="region" placeholder="Toshkent" value={form.region} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label htmlFor="district" className="text-sm font-medium text-slate-700 dark:text-slate-300">Tuman</label>
                <Input id="district" name="district" placeholder="Chilonzor" value={form.district} onChange={handleChange} />
              </div>
            </div>
            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />{loading ? 'Saqlanmoqda...' : 'Saqlash'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
