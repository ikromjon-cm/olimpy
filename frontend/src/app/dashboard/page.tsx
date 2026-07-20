'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Trophy, Users, Award, ClipboardList, ArrowRight, Calendar, MapPin, CheckCircle, Clock, Star } from 'lucide-react';
import { formatDate, formatPrice, getStatusColor, getStatusLabel } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Olympiad, Registration } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalOlympiads: number;
  activeRegistrations: number;
  completedExams: number;
  earnedCertificates: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalOlympiads: 0,
    activeRegistrations: 0,
    completedExams: 0,
    earnedCertificates: 0,
  });
  const [upcomingOlympiads, setUpcomingOlympiads] = useState<Olympiad[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [olympiadsRes, registrationsRes] = await Promise.all([
        api.get<Olympiad[]>('/olympiads/active'),
        api.get<Registration[]>('/registrations'),
      ]);

      const olymData = ((olympiadsRes.data as { data?: Olympiad[] })?.data) || (olympiadsRes.data as Olympiad[]);
      setUpcomingOlympiads(Array.isArray(olymData) ? olymData : []);
      
      const regData = ((registrationsRes.data as { data?: Registration[] })?.data) || (registrationsRes.data as Registration[]);
      setMyRegistrations(Array.isArray(regData) ? regData : []);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const pendingRegistrations = myRegistrations.filter(r => r.status === 'PENDING');
  const paidRegistrations = myRegistrations.filter(r => r.status === 'PAID');
  const attendedRegistrations = myRegistrations.filter(r => r.attendance?.status === 'ATTENDED');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="h-28"><Skeleton className="h-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent><div className="space-y-4">{[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-20" />))}</div></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <title>Bosh sahifa — Olimpiy</title>
      <meta name="description" content="Olimpiy bosh sahifasi — faol olimpiadalar va arizalaringiz." />

      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 lg:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
      >
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white">
            Salom, {user?.fullName?.split(' ')[0] || 'O\'quvchi'}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5">
            Bugun nima qilamiz? Olimpiada tanlang va ro'yxatdan o'ting.
          </p>
        </div>
        <Link href="/dashboard/olympiads" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary-600 text-white font-medium hover:bg-primary-500 transition-all shadow-[0_4px_14px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] active:scale-[0.97]">
          <Trophy className="w-4 h-4" />
          Olimpiadalarni ko'rish
        </Link>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Faol olimpiadalar"
          value={upcomingOlympiads.length}
          icon={Trophy}
          color="primary"
          description={upcomingOlympiads.length > 0 ? 'Ro\'yxatdan o\'tish ochiq' : 'Hozircha yo\'q'}
          delay={0.1}
        />
        <StatCard
          title="Kutilayotgan arizalar"
          value={pendingRegistrations.length}
          icon={ClipboardList}
          color="warning"
          description={pendingRegistrations.length > 0 ? 'To\'lov amalga oshiring' : 'Hammasi to\'langan'}
          delay={0.15}
        />
        <StatCard
          title="Tasdiqlangan arizalar"
          value={paidRegistrations.length}
          icon={CheckCircle}
          color="success"
          description={paidRegistrations.length > 0 ? 'Chipta yuklab olish mumkin' : 'Hali yo\'q'}
          delay={0.2}
        />
        <StatCard
          title="Sertifikatlar"
          value={attendedRegistrations.filter(r => r.result?.certificateUrl).length}
          icon={Award}
          color="secondary"
          description='Sertifikatlar yuklab olingan'
          delay={0.25}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Olympiads */}
        <Card variant="strong" className="border border-white/40 dark:border-white/[0.06] shadow-apple-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5 text-primary-600" />
              Yaqinlashayotgan olimpiadalar
            </CardTitle>
            <Link href="/dashboard/olympiads" className="text-sm text-primary-600 hover:text-primary-500 font-medium transition-colors">Barchasi →</Link>
          </CardHeader>
          <CardContent>
            {upcomingOlympiads.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Trophy className="w-14 h-14 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Hozircha faol olimpiadalar yo'q</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide pr-2">
                {upcomingOlympiads.slice(0, 5).map((olympiad, idx) => (
                  <OlympiadCard key={olympiad.id} olympiad={olympiad} delay={0.1 * idx} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Registrations */}
        <Card variant="strong" className="border border-white/40 dark:border-white/[0.06] shadow-apple-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="w-5 h-5 text-primary-600" />
              Mening arizalarim
            </CardTitle>
            <Link href="/dashboard/registrations" className="text-sm text-primary-600 hover:text-primary-500 font-medium transition-colors">Barchasi →</Link>
          </CardHeader>
          <CardContent>
            {myRegistrations.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <ClipboardList className="w-14 h-14 mx-auto mb-3 opacity-30" />
                <p className="text-sm mb-4">Hozircha arizalar yo'q</p>
                <Link href="/dashboard/olympiads" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-500 transition-all shadow-[0_4px_14px_rgba(99,102,241,0.3)]">
                  <Trophy className="w-4 h-4" />
                  Olimpiada tanlash
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide pr-2">
                {myRegistrations.slice(0, 5).map((reg, idx) => (
                  <RegistrationCard key={reg.id} registration={reg} delay={0.1 * idx} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card variant="strong" className="border border-white/40 dark:border-white/[0.06] shadow-apple-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="w-5 h-5 text-amber-500" />
            Tezkor harakatlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickActionCard
              title="Olimpiada qidirish"
              description="Barcha faol olimpiadalarni ko'ring"
              icon={Trophy}
              href="/dashboard/olympiads"
              color="primary"
              delay={0.1}
            />
            <QuickActionCard
              title="Arizalarim"
              description="Ro'yxatdan o'tgan olimpiadalar"
              icon={ClipboardList}
              href="/dashboard/registrations"
              color="success"
              delay={0.15}
            />
            <QuickActionCard
              title="Natijalar"
              description="Ballar va sertifikatlar"
              icon={Award}
              href="/dashboard/results"
              color="secondary"
              delay={0.2}
            />
            <QuickActionCard
              title="Profil"
              description="Ma'lumotlarni yangilash"
              icon={Users}
              href="/dashboard/profile"
              color="info"
              delay={0.25}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, description, delay = 0 }: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'success' | 'warning' | 'secondary' | 'info';
  description: string;
  delay?: number;
}) {
  const colors = {
    primary: 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-200/50 dark:border-primary-500/20',
    success: 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200/50 dark:border-green-500/20',
    warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20',
    secondary: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200/50 dark:border-orange-500/20',
    info: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-500/20',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card variant="strong" className="p-6 border border-white/40 dark:border-white/[0.06] shadow-apple-lg hover:shadow-apple-xl transition-all duration-500 hover:-translate-y-0.5">
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">{title}</p>
              <p className="font-display font-bold text-3xl lg:text-4xl tracking-tight text-slate-900 dark:text-white">{value}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{description}</p>
            </div>
            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center border', colors[color])}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function OlympiadCard({ olympiad, delay = 0 }: { olympiad: Olympiad, delay?: number }) {
  const isRegistrationOpen = new Date(olympiad.regEndDate) > new Date();
  const daysLeft = Math.ceil((new Date(olympiad.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}>
      <Link href={`/dashboard/olympiads/${olympiad.id}`} className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-white/[0.04] backdrop-blur-xl border border-white/30 dark:border-white/[0.06] hover:bg-white/70 dark:hover:bg-white/[0.08] hover:shadow-apple-lg transition-all duration-300 group">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border border-primary-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
          <Trophy className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">{olympiad.title}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">{olympiad.subject} • {formatPrice(Number(olympiad.price))}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-white/50 dark:bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/30 dark:border-white/[0.06]">
              <Calendar className="w-3 h-3" />
              {formatDate(olympiad.examDate)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-white/50 dark:bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/30 dark:border-white/[0.06]">
              <Clock className="w-3 h-3" />
              {daysLeft > 0 ? `${daysLeft} kun qoldi` : 'Bugun'}
            </span>
          </div>
        </div>
        <Badge variant={isRegistrationOpen ? 'success' : 'default'}>{isRegistrationOpen ? 'Ochiq' : 'Yopiq'}</Badge>
      </Link>
    </motion.div>
  );
}

function RegistrationCard({ registration, delay = 0 }: { registration: Registration, delay?: number }) {
  const statusColor = getStatusColor(registration.status);
  const statusLabel = getStatusLabel(registration.status);

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}>
      <Link href={`/dashboard/registrations/${registration.id}`} className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-white/[0.04] backdrop-blur-xl border border-white/30 dark:border-white/[0.06] hover:bg-white/70 dark:hover:bg-white/[0.08] hover:shadow-apple-lg transition-all duration-300 group">
        <div className="w-12 h-12 rounded-2xl bg-white/50 dark:bg-white/[0.04] border border-white/30 dark:border-white/[0.06] flex items-center justify-center shadow-sm">
          <ClipboardList className="w-6 h-6 text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">{registration.olympiad?.title}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {registration.location?.name} • {registration.room?.roomNumber} • {registration.seatNumber}-parta
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={statusColor as any}>{statusLabel}</Badge>
            {registration.payment && (
              <Badge variant={registration.payment.status === 'SUCCESS' ? 'success' : 'warning'}>
                {registration.payment.status === 'SUCCESS' ? 'To\'langan' : 'Kutilmoqda'}
              </Badge>
            )}
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
      </Link>
    </motion.div>
  );
}

function QuickActionCard({ title, description, icon: Icon, href, color, delay = 0 }: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: 'primary' | 'success' | 'secondary' | 'info';
  delay?: number;
}) {
  const colors = {
    primary: 'hover:border-primary-500/30 hover:shadow-[0_4px_20px_rgba(99,102,241,0.1)]',
    success: 'hover:border-green-500/30 hover:shadow-[0_4px_20px_rgba(16,185,129,0.1)]',
    secondary: 'hover:border-amber-500/30 hover:shadow-[0_4px_20px_rgba(245,158,11,0.1)]',
    info: 'hover:border-blue-500/30 hover:shadow-[0_4px_20px_rgba(59,130,246,0.1)]',
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}>
      <Link 
        href={href} 
        className={cn(
          'flex flex-col items-center text-center p-6 h-full rounded-2xl',
          'bg-white/50 dark:bg-white/[0.04] backdrop-blur-xl',
          'border border-white/30 dark:border-white/[0.06]',
          'hover:bg-white/70 dark:hover:bg-white/[0.08]',
          'transition-all duration-300 group',
          colors[color]
        )}
      >
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-white/60 dark:bg-white/[0.06] backdrop-blur-xl border border-white/30 dark:border-white/[0.06] group-hover:scale-110 transition-transform duration-300 shadow-sm">
          <Icon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </div>
        <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </Link>
    </motion.div>
  );
}
