'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Save, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { api, baseApi, BASE_URL } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import type { User as UserType } from '@/types';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Ism kamida 2 ta belgi bo\'lishi kerak').max(100),
  schoolName: z.string().min(2, 'Maktab nomi kamida 2 ta belgi').max(100),
  grade: z.number().min(1, 'Sinf 1 dan 11 gacha').max(11, 'Sinf 1 dan 11 gacha'),
  region: z.string().min(1, 'Viloyatni tanlang'),
  district: z.string().min(1, 'Tumanni tanlang'),
  parentPhone: z.string().optional().refine(val => !val || /^[\d\s\-\+\(\)]{9,}$/.test(val), 'Noto\'g\'ri telefon format'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface Region {
  id: string;
  name: string;
  nameUz: string;
  order: number;
}

interface District {
  id: string;
  name: string;
  nameUz: string;
  regionId: string;
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [password, setPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      schoolName: user?.schoolName || '',
      grade: user?.grade || undefined,
      region: user?.region || '',
      district: user?.district || '',
      parentPhone: user?.parentPhone || '',
    },
  });

  const selectedRegion = form.watch('region');

  useEffect(() => {
    api.regions.getRegions().then(res => { const d = res.data?.data ?? res.data; if (Array.isArray(d)) setRegions(d); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedRegion) {
      setDistricts([]);
      return;
    }
    const region = regions.find(r => r.name === selectedRegion);
    if (!region) return;
    let active = true;
    form.setValue('district', '');
    api.regions.getDistricts(region.id).then(res => {
      const d = res.data?.data ?? res.data;
      if (active && Array.isArray(d)) setDistricts(d);
    }).catch(() => { if (active) setDistricts([]); });
    return () => { active = false; };
  }, [selectedRegion, regions]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      await api.userApi.updateProfile(data);
      setUser({ ...user, ...data } as UserType);
      toast({
        title: 'Saqlandi',
        description: 'Profilingiz muvaffaqiyatli yangilandi',
        variant: 'success',
      });
    } catch (error: unknown) {
      toast({
        title: 'Xatolik',
        description: error instanceof Error ? error.message : 'Profilni yangilashda xatolik',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await baseApi.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const avatarUrl = uploadRes.data?.url || uploadRes.data?.data?.url;

      if (avatarUrl) {
        await api.userApi.updateProfile({ avatarUrl });
        setUser({ ...user, avatarUrl } as UserType);
        toast({ title: 'Rasm yangilandi', variant: 'success' });
      }
    } catch (err: unknown) {
      toast({ title: 'Xatolik', description: err instanceof Error ? err.message : 'Rasm yuklashda xatolik', variant: 'error' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (password.length < 6) {
      toast({ title: 'Xatolik', description: 'Parol kamida 6 ta belgi bo\'lishi kerak', variant: 'error' });
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await api.userApi.updateProfile({ password });
      toast({ title: 'Parol yangilandi', variant: 'success' });
      setPassword('');
    } catch (err: unknown) {
      toast({ title: 'Xatolik', description: err instanceof Error ? err.message : 'Parolni yangilashda xatolik', variant: 'error' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <title>Profil — Olimpiy</title>
      <meta name="description" content="Shaxsiy profilingizni ko'rish va tahrirlash." />
      <div className="glass-card p-6 lg:p-8 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white">Shaxsiy ma'lumotlar</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Profilingizni tahrirlang va saqlang</p>
        </div>
        <div className="flex items-center gap-3 relative">
          <label className={cn("relative cursor-pointer group", uploadingAvatar && "opacity-50 pointer-events-none")}>
            <Avatar className="w-16 h-16 rounded-2xl border-2 border-white/40 dark:border-white/[0.06] group-hover:border-primary-500/50 transition-all duration-300 shadow-apple-lg">
              <AvatarImage src={user?.avatarUrl ? `${BASE_URL}${user.avatarUrl}` : user?.avatar || ''} alt={user?.fullName || ''} className="object-cover" />
              <AvatarFallback className="text-xl font-display font-bold rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 text-white">
                {user?.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
            <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer backdrop-blur-sm">
              {uploadingAvatar ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Save className="w-5 h-5 text-white" />}
            </div>
          </label>
        </div>
      </div>

      <Card variant="strong" className="border border-white/40 dark:border-white/[0.06] shadow-apple-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-primary-600" />
            Asosiy ma'lumotlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="To'liq ism"
                placeholder="Ism Familiya"
                {...form.register('fullName')}
              />
              <Input
                label="Maktab nomi/raqami"
                placeholder="Masalan: 12-maktab"
                {...form.register('schoolName')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                value={form.watch('grade')?.toString() || ''}
                onValueChange={v => form.setValue('grade', v ? parseInt(v) : undefined as unknown as number)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sinf" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => i + 1).map((grade) => (
                    <SelectItem key={grade} value={grade.toString()}>{grade}-sinf</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={form.watch('region') || ''}
                onValueChange={v => form.setValue('region', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Viloyat" />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(regions) ? regions : []).map((region) => (
                    <SelectItem key={region.id} value={region.name}>{region.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={form.watch('district') || ''}
                onValueChange={v => form.setValue('district', v)}
                disabled={districts.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tuman" />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(districts) ? districts : []).map((district) => (
                    <SelectItem key={district.id} value={district.name}>{district.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input
              label="Ota-ona telefoni (ixtiyoriy)"
              placeholder="+998 XX XXX XX XX"
              type="tel"
              {...form.register('parentPhone')}
            />

            <div className="flex justify-end gap-3 pt-5 border-t border-white/30 dark:border-white/[0.06]">
              <Button type="submit" size="lg" loading={isLoading} className="shadow-[0_4px_14px_rgba(99,102,241,0.3)]">
                <Save className="w-4 h-4 mr-2" />
                Saqlash
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card variant="strong" className="border border-white/40 dark:border-white/[0.06] shadow-apple-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Xavfsizlik
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-5 rounded-2xl bg-white/50 dark:bg-white/[0.04] backdrop-blur-xl border border-white/30 dark:border-white/[0.06]">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Parolni o'zgartirish</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Yangi parolni kiriting va saqlang.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md">
              <Input type="password" placeholder="Yangi parol (kamida 6 ta belgi)" value={password} onChange={e => setPassword(e.target.value)} />
              <Button onClick={handlePasswordUpdate} disabled={isUpdatingPassword || password.length < 6} className="whitespace-nowrap">
                {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Saqlash'}
              </Button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/50 dark:bg-white/[0.04] backdrop-blur-xl border border-white/30 dark:border-white/[0.06]">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Tizimdan chiqish</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Barcha qurilmalardan tizimdan chiqish uchun quyidagi tugmani bosing.
            </p>
            <Button variant="destructive" onClick={() => useAuthStore.getState().logout()}>
              Barcha qurilmalardan chiqish
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
