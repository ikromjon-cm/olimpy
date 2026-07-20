'use client';


import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Trophy, DollarSign, TrendingUp, Calendar, BarChart2, AlertCircle } from 'lucide-react';
import { formatDate, formatPrice, getStatusColor, getStatusLabel } from '@/lib/utils';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

interface AdminDashboardProps {
  searchParams: { page?: string };
}

export default function AdminDashboardPage({ searchParams }: AdminDashboardProps) {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [olympiads, setOlympiads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [passcode, setPasscode] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;
    fetchDashboardStats();
    fetchRegistrations();
    fetchOlympiads();
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      const res = await api.admin.getDashboard();
      setStats(res.data?.data || res.data);
    } catch (err) {
      console.error('Stats fetch error:', err);
      toast({ title: 'Xatolik', description: 'Statistikani yuklashda xatolik', variant: 'error' });
    }
  };

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/registrations?page=1&limit=10');
      let arr = [];
      if (Array.isArray(res.data?.data?.data)) arr = res.data.data.data;
      else if (Array.isArray(res.data?.data)) arr = res.data.data;
      else if (Array.isArray(res.data)) arr = res.data;
      setRegistrations(arr);
    } catch (err) {
      console.error('Registrations fetch error:', err);
      toast({ title: 'Xatolik', description: 'Arizalarni yuklashda xatolik', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchOlympiads = async () => {
    setLoading(true);
    try {
      const res = await api.olympiads.getAllAdmin({ page: 1, limit: 10 });
      let arr = [];
      if (Array.isArray(res.data?.data?.data)) arr = res.data.data.data;
      else if (Array.isArray(res.data?.data)) arr = res.data.data;
      else if (Array.isArray(res.data)) arr = res.data;
      setOlympiads(arr);
    } catch (err) {
      console.error('Olympiads fetch error:', err);
      toast({ title: 'Xatolik', description: 'Olimpiadalarni yuklashda xatolik', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasscodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const res = await api.auth.adminPasscodeLogin(passcode);
      const { accessToken, refreshToken } = res.data?.data || res.data;
      
      useAuthStore.setState({ accessToken, refreshToken });
      const meRes = await api.auth.me();
      useAuthStore.getState().setAuth({ user: meRes.data?.data || meRes.data, accessToken, refreshToken });
      
      toast({ title: 'Admin panelga xush kelibsiz', variant: 'success' });
    } catch (err: unknown) {
      toast({ title: 'Xato', description: err instanceof Error ? err.message : 'Kod xato', variant: 'error' });
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <Card className="w-full max-w-sm shadow-xl">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <CardTitle className="text-center font-display font-bold text-2xl">Admin Panel</CardTitle>
            <p className="text-center text-sm text-slate-500 mt-2">Tizimga kirish uchun maxfiy kodni kiriting</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasscodeLogin} className="space-y-4">
              <div className="space-y-2">
                <Input 
                  type="password" 
                  placeholder="Maxfiy kod" 
                  value={passcode} 
                  onChange={e => setPasscode(e.target.value)} 
                  autoFocus
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? 'Tekshirilmoqda...' : 'Kirish'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <title>Admin panel — Olimpiy</title>
      <meta name="description" content="Admin panel — tizim boshqaruvi va statistika." />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white">Admin Panel</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Tizim boshqaruvi va statistika</p>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard title="Jami foydalanuvchilar" value={stats.users?.total || 0} icon={Users} color="primary" description={`${stats.users?.students || 0} o'quvchi, ${stats.users?.proctors || 0} nazoratchi`} />
          <StatCard title="Faol olimpiadalar" value={stats.olympiads?.active || 0} icon={Trophy} color="success" description={`${stats.olympiads?.upcoming || 0} yaqinlashayotgan`} />
          <StatCard title="To'langan arizalar" value={stats.registrations?.paid || 0} icon={DollarSign} color="secondary" description={`Jami: ${stats.registrations?.total || 0}`} />
          <StatCard title="Umumiy daromad" value={formatPrice(stats.revenue?.total || 0)} icon={TrendingUp} color="info" description="To'langan arizalardan" />
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="gradient-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Yaqinlashayotgan olimpiadalar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {olympiads.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">Olimpiadalar mavjud emas</p>
              ) : (
                olympiads.slice(0, 10).map((oly: any) => (
                  <div key={oly.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">{oly.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {oly.subject} • {formatDate(oly.examDate)}
                      </p>
                    </div>
                    <Badge variant={oly.isActive ? 'success' : 'default'} className="flex-shrink-0">
                      {oly._count?.registrations || 0} ta
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5" />
              So'nggi ro'yxatdan o'tishlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {registrations.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">Arizalar mavjud emas</p>
              ) : (
                registrations.slice(0, 10).map((reg: any) => (
                  <div key={reg.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">{reg.user?.fullName || 'Noma\'lum'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {reg.olympiad?.title || 'Olimpiada'} • {reg.user?.phoneNumber || ''}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(reg.status)} className="flex-shrink-0">
                      {getStatusLabel(reg.status)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}



function StatCard({ title, value, icon: Icon, color, description }: { title: string; value: number | string; icon: React.ComponentType<{ className?: string }>; color: string; description?: string }) {
  const colors: Record<string, string> = {
    primary: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    success: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    secondary: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    info: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  };

  return (
    <Card className="card-hover border-none shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
            <p className="font-display font-bold text-3xl text-slate-900 dark:text-white">{value}</p>
            {description && <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">{description}</p>}
          </div>
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm', colors[color] || colors.primary)}>
            <Icon className="w-7 h-7" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}