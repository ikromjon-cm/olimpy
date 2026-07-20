'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Phone, Lock, User, GraduationCap, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { normalizePhone, isValidPhone } from '@/lib/utils';
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'reset'>('login');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regData, setRegData] = useState({ phoneNumber: '', password: '', fullName: '', schoolName: '', grade: '', region: '', district: '' });
  const [regions, setRegions] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const [resetData, setResetData] = useState({ phoneNumber: '', otp: '', newPassword: '' });
  const [resetStep, setResetStep] = useState<'phone' | 'otp'>('phone');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    const fetchRegions = async () => {
      setLoadingRegions(true);
      try {
        const res = await api.regions.getRegions();
        const d = res.data?.data ?? res.data; setRegions(Array.isArray(d) ? d : []);
      } catch {
        setRegions([]);
      } finally {
        setLoadingRegions(false);
      }
    };
    fetchRegions();
  }, []);

  useEffect(() => {
    if (!regData.region) {
      setDistricts([]);
      return;
    }
    const region = regions.find((r: any) => r.name === regData.region);
    if (!region) return;
    let active = true;
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const res = await api.regions.getDistricts(region.id);
        const d = res.data?.data ?? res.data;
        if (active) setDistricts(Array.isArray(d) ? d : []);
      } catch {
        if (active) setDistricts([]);
      } finally {
        if (active) setLoadingDistricts(false);
      }
    };
    fetchDistricts();
    return () => { active = false; };
  }, [regData.region, regions]);

  const fetchAndSetUser = async (accessToken: string, refreshToken: string) => {
    const me = await api.auth.me();
    const user = me.data?.data || me.data;
    setAuth({ user, accessToken, refreshToken });
    return user;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!isValidPhone(loginPhone)) {
      setErrors({ loginPhone: 'Telefon raqam formati noto\'g\'ri' });
      return;
    }
    setIsLoading(true);
    try {
      const phone = normalizePhone(loginPhone);
      const res = await api.post('/auth/login', { phoneNumber: phone, password: loginPassword });
      const { accessToken, refreshToken } = res.data?.data || res.data;
      const user = await fetchAndSetUser(accessToken, refreshToken);
      toast({ title: 'Xush kelibsiz!', variant: 'success' });
      if (user?.role === 'ADMIN') { router.push('/admin'); }
      else { router.push('/'); }
    } catch (err: unknown) {
      toast({ title: 'Xatolik', description: err instanceof Error ? err.message : 'Telefon raqam yoki parol noto\'g\'ri', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const regErrs: Record<string, string> = {};
    if (!isValidPhone(regData.phoneNumber)) regErrs.regPhone = 'Telefon raqam formati noto\'g\'ri';
    if (regData.password.length < 6) regErrs.regPassword = 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak';
    if (regData.grade) {
      const g = Number(regData.grade);
      if (isNaN(g) || g < 1 || g > 11) regErrs.regGrade = 'Sinf 1-11 oralig\'ida bo\'lishi kerak';
    }
    if (Object.keys(regErrs).length > 0) { setErrors(regErrs); return; }
    setIsLoading(true);
    try {
      const phone = normalizePhone(regData.phoneNumber);
      const res = await api.post('/auth/register', {
        ...regData,
        phoneNumber: phone,
        grade: Number(regData.grade)
      });
      const { accessToken, refreshToken } = res.data?.data || res.data;
      const user = await fetchAndSetUser(accessToken, refreshToken);
      toast({ title: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz!', variant: 'success' });
      if (user?.role === 'ADMIN') { router.push('/admin'); }
      else { router.push('/'); }
    } catch (err: unknown) {
      toast({ title: 'Xatolik', description: err instanceof Error ? err.message : 'Xatolik yuz berdi', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async (phone: string) => {
    setIsLoading(true);
    try {
      const normalized = normalizePhone(phone);
      const res = await api.auth.sendOtp(normalized);
      const devOtp = res.data?.data?.devOtp || res.data?.devOtp;
      if (devOtp) setResetData(prev => ({ ...prev, otp: devOtp }));
      toast({ title: 'Kod yuborildi', description: 'SMS kodni kiriting', variant: 'success' });
      setResendCooldown(30);
    } catch (err: unknown) {
      toast({ title: 'Xatolik', description: err instanceof Error ? err.message : 'Xatolik yuz berdi', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!isValidPhone(resetData.phoneNumber)) {
      setErrors({ resetPhone: 'Telefon raqam formati noto\'g\'ri' });
      return;
    }
    setResetStep('otp');
    await sendOtp(resetData.phoneNumber);
  };

  const handleResendOtp = () => sendOtp(resetData.phoneNumber);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const phone = normalizePhone(resetData.phoneNumber);
      await api.post('/auth/reset-password', {
        phoneNumber: phone,
        otp: resetData.otp,
        newPassword: resetData.newPassword
      });
      toast({ title: 'Parol muvaffaqiyatli o\'zgartirildi!', variant: 'success' });
      setActiveTab('login');
      setResetStep('phone');
      setResetData({ phoneNumber: '', otp: '', newPassword: '' });
      setLoginPhone(resetData.phoneNumber);
    } catch (err: unknown) {
      toast({ title: 'Xatolik', description: err instanceof Error ? err.message : 'Xatolik yuz berdi', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary-500/8 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center shadow-[0_8px_30px_rgba(99,102,241,0.3)] group-hover:shadow-[0_12px_40px_rgba(99,102,241,0.4)] transition-all duration-500">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5" strokeWidth="1.5"/>
                <line x1="12" y1="3" x2="12" y2="7"/><line x1="12" y1="17" x2="12" y2="21"/>
                <line x1="3" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="21" y2="12"/>
              </svg>
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl tracking-tight text-slate-900 dark:text-white">Olimpiy</h1>
              <p className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-[0.15em]">Offline platforma</p>
            </div>
          </Link>
        </div>

        <Card variant="strong" className="shadow-[0_20px_60px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
          <CardContent className="p-6 sm:p-8">
            {activeTab === 'reset' ? (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h2 className="font-display font-semibold text-xl tracking-tight text-slate-900 dark:text-white">Parolni tiklash</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {resetStep === 'phone' ? 'Telefon raqamingizni kiriting' : 'SMS kodni va yangi parolni kiriting'}
                  </p>
                </div>

                {resetStep === 'phone' ? (
                  <motion.form key="reset-phone" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleSendResetOtp} className="space-y-5">
                    <div className="space-y-2">
                      <label htmlFor="resetPhone" className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefon raqam</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input id="resetPhone" required className="pl-11" placeholder="+998 90 123 45 67" value={resetData.phoneNumber} onChange={e => { setResetData({...resetData, phoneNumber: e.target.value}); if (errors.resetPhone) setErrors(prev => { const n = { ...prev }; delete n.resetPhone; return n; }); }} />
                        {errors.resetPhone && <p className="text-sm text-red-500 mt-1">{errors.resetPhone}</p>}
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Yuborilmoqda...' : 'Kodni yuborish'}</Button>
                    <Button type="button" variant="ghost" className="w-full text-slate-500" onClick={() => setActiveTab('login')}>Orqaga</Button>
                  </motion.form>
                ) : (
                  <motion.form key="reset-otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleResetPassword} className="space-y-5">
                    <div className="space-y-2">
                      <label htmlFor="resetOtp" className="text-sm font-medium text-slate-700 dark:text-slate-300">SMS Kod</label>
                      <Input id="resetOtp" required placeholder="123456" maxLength={6} value={resetData.otp} onChange={e => setResetData({...resetData, otp: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="resetNewPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">Yangi parol</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input id="resetNewPassword" required type="password" className="pl-11" placeholder="Yangi parol (kamida 6 ta belgi)" minLength={6} value={resetData.newPassword} onChange={e => setResetData({...resetData, newPassword: e.target.value})} />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Saqlanmoqda...' : 'Parolni saqlash'}</Button>
                    <Button type="button" variant="outline" className="w-full" disabled={resendCooldown > 0 || isLoading} onClick={handleResendOtp}>
                      {resendCooldown > 0 ? `${resendCooldown}s dan keyin qayta yuborish` : 'Kodni qayta yuborish'}
                    </Button>
                    <Button type="button" variant="ghost" className="w-full text-slate-500" onClick={() => setResetStep('phone')}>Orqaga</Button>
                  </motion.form>
                )}
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as 'login' | 'register' | 'reset')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 p-1.5 bg-white/50 dark:bg-white/[0.04] backdrop-blur-2xl rounded-2xl border border-white/30 dark:border-white/[0.06]">
                  <TabsTrigger value="login" className="rounded-xl text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-white/[0.08] data-[state=active]:shadow-[0_4px_12px_rgba(0,0,0,0.04)] dark:data-[state=active]:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300">Kirish</TabsTrigger>
                  <TabsTrigger value="register" className="rounded-xl text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-white/[0.08] data-[state=active]:shadow-[0_4px_12px_rgba(0,0,0,0.04)] dark:data-[state=active]:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-300">Ro'yxatdan o'tish</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <label htmlFor="loginPhone" className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefon raqam</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input id="loginPhone" required className="pl-11" placeholder="+998 90 123 45 67" value={loginPhone} onChange={e => { setLoginPhone(e.target.value); if (errors.loginPhone) setErrors(prev => { const n = { ...prev }; delete n.loginPhone; return n; }); }} />
                        {errors.loginPhone && <p className="text-sm text-red-500 mt-1">{errors.loginPhone}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="loginPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">Parol</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input id="loginPassword" required type="password" className="pl-11" placeholder="Parol" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={() => setActiveTab('reset')} className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium">Parolni unutdingizmi?</button>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Kirilmoqda...' : 'Tizimga kirish'}</Button>
                  </motion.form>
                </TabsContent>

                <TabsContent value="register">
                  <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} onSubmit={handleRegister} className="space-y-5">
                    <div className="space-y-2">
                      <label htmlFor="regFullName" className="text-sm font-medium text-slate-700 dark:text-slate-300">F.I.O</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input id="regFullName" required className="pl-11" placeholder="Eshmatov Toshmat" value={regData.fullName} onChange={e => setRegData({...regData, fullName: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="regPhone" className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefon raqam</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input id="regPhone" required className="pl-11" placeholder="+998 90 123 45 67" value={regData.phoneNumber} onChange={e => { setRegData({...regData, phoneNumber: e.target.value}); if (errors.regPhone) setErrors(prev => { const n = { ...prev }; delete n.regPhone; return n; }); }} />
                        {errors.regPhone && <p className="text-sm text-red-500 mt-1">{errors.regPhone}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="regPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">Parol</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input id="regPassword" required type="password" minLength={6} className="pl-11" placeholder="Parol (kamida 6 ta belgi)" value={regData.password} onChange={e => { setRegData({...regData, password: e.target.value}); if (errors.regPassword) setErrors(prev => { const n = { ...prev }; delete n.regPassword; return n; }); }} />
                        {errors.regPassword && <p className="text-sm text-red-500 mt-1">{errors.regPassword}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="regSchool" className="text-sm font-medium text-slate-700 dark:text-slate-300">Maktab</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input id="regSchool" required className="pl-11" placeholder="Masalan: 1-sonli maktab" value={regData.schoolName} onChange={e => setRegData({...regData, schoolName: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="regRegion" className="text-sm font-medium text-slate-700 dark:text-slate-300">Viloyat</label>
                        <Select value={regData.region} onValueChange={v => setRegData({...regData, region: v, district: ''})} disabled={loadingRegions}>
                          <SelectTrigger id="regRegion">
                            <SelectValue placeholder={loadingRegions ? 'Yuklanmoqda...' : 'Viloyat'} />
                          </SelectTrigger>
                          <SelectContent>
                            {regions.map((r: any) => (
                              <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="regDistrict" className="text-sm font-medium text-slate-700 dark:text-slate-300">Tuman</label>
                        <Select value={regData.district} onValueChange={v => setRegData({...regData, district: v})} disabled={!regData.region || loadingDistricts}>
                          <SelectTrigger id="regDistrict">
                            <SelectValue placeholder={!regData.region ? 'Viloyat' : loadingDistricts ? 'Yuklanmoqda...' : 'Tuman'} />
                          </SelectTrigger>
                          <SelectContent>
                            {districts.map((d: any) => (
                              <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="regGrade" className="text-sm font-medium text-slate-700 dark:text-slate-300">Sinf</label>
                      <Input id="regGrade" required type="number" min="1" max="11" placeholder="Masalan: 10" value={regData.grade} onChange={e => { setRegData({...regData, grade: e.target.value}); if (errors.regGrade) setErrors(prev => { const n = { ...prev }; delete n.regGrade; return n; }); }} />
                      {errors.regGrade && <p className="text-sm text-red-500 mt-1">{errors.regGrade}</p>}
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Ro\'yxatdan o\'tilmoqda...' : 'Ro\'yxatdan o\'tish'}</Button>
                  </motion.form>
                </TabsContent>
              </Tabs>
            )}

            <div className="mt-6 pt-5 border-t border-white/30 dark:border-white/[0.06] text-center">
              <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Bosh sahifaga qaytish
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
