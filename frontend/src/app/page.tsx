'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Trophy, Users, Award, ArrowRight, ChevronDown, CheckCircle, Sparkles, Zap, Globe, Mail, Phone,
  CreditCard, QrCode, FileText, Building2, ScanLine, X, Menu, HelpCircle, BookOpen, Star,  Sun, Moon, MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const stats = [
  { icon: Users, value: '50,000+', label: 'O\'quvchilar', suffix: 'ro\'yxatdan o\'tgan' },
  { icon: Trophy, value: '200+', label: 'Olimpiadalar', suffix: 'muvaffaqiyatli o\'tkazilgan' },
  { icon: Award, value: '1,000+', label: 'Sertifikatlar', suffix: 'berilgan' },
  { icon: Building2, value: '50+', label: 'Hamkorlar', suffix: 'maktab va universitet' },
];

const features = [
  {
    icon: Zap, title: 'Tezkor ro\'yxatdan o\'tish',
    description: 'SMS kod orqali 60 soniyada ro\'yxatdan o\'ting. Hech qanday murakkab formalar yo\'q.',
    gradient: 'from-primary-500/10 to-primary-500/5',
  },
  {
    icon: MapPin, title: 'Joylashuvni tanlash',
    description: 'Qulay bino, xona va partani real vaqtda ko\'ring. Bo\'sh joylar soni avtomatik yangilanadi.',
    gradient: 'from-emerald-500/10 to-emerald-500/5',
  },
  {
    icon: CreditCard, title: 'Xavfsiz to\'lov',
    description: 'Click va Payme orqali xavfsiz to\'lov. To\'lovdan keyin chipta avtomatik generatsiya qilinadi.',
    gradient: 'from-blue-500/10 to-blue-500/5',
  },
  {
    icon: QrCode, title: 'QR kodli chipta',
    description: 'Har bir chipta unikal QR kod bilan. Imtihon kunida tezda va xavfsiz kirish.',
    gradient: 'from-purple-500/10 to-purple-500/5',
  },
  {
    icon: ScanLine, title: 'Mobil nazoratchi',
    description: 'Nazoratchilar uchun mobil interfeys. Kameradan QR skanerlash, tovushli xabarlar.',
    gradient: 'from-rose-500/10 to-rose-500/5',
  },
  {
    icon: FileText, title: 'Natijalar va sertifikatlar',
    description: 'Imtihon natijalari, reytinglar va sertifikatlar shaxsiy kabinetda PDF formatida.',
    gradient: 'from-cyan-500/10 to-cyan-500/5',
  },
];

const steps = [
  { number: '01', title: 'Telefon raqam', description: 'Raqamingizni kiriting va SMS kodni oling', icon: Phone },
  { number: '02', title: 'Olimpiada tanlash', description: 'Fan, til va imtihon sanasini tanlang', icon: BookOpen },
  { number: '03', title: 'Joylashuv', description: 'Bino, xona va bo\'sh partani tanlang', icon: MapPin },
  { number: '04', title: 'To\'lov', description: 'Click yoki Payme orqali to\'lov qiling', icon: CreditCard },
  { number: '05', title: 'Chipta oling', description: 'PDF chipta yuklab oling va imtihonga keling', icon: QrCode },
];

const faqs = [
  { question: 'Ro\'yxatdan o\'tish qancha vaqt oladi?', answer: 'Barcha jarayon 5-10 daqiqa ichida tugallanadi. SMS kod 60 soniya ichida keladi.' },
  { question: 'To\'lov qanday amalga oshiriladi?', answer: 'Click va Payme tizimlari orqali xavfsiz to\'lov. Karta, mobil banking yoki naqd pul orqali to\'lash mumkin.' },
  { question: 'Chipta qachon generatsiya qilinadi?', answer: 'To\'lov muvaffaqiyatli amalga oshirilgach, chipta avtomatik PDF formatida generatsiya qilinadi va shaxsiy kabinetda yuklab olish uchun tayyor bo\'ladi.' },
  { question: 'Imtihon kunida nima kerak?', answer: 'Shaxsiy hujjat (pasport/shaxsiy) va telefoningizdagi QR kodli chipta (yoki yuklab olingan PDF).' },
  { question: 'Agar kelolmasam nima bo\'ladi?', answer: 'Kelmaslik holatida arizangiz "Kelmadi" holatiga o\'tadi. Qayta imtihon topshirish imkoniyati olimpiada qoidalariga qarab belgilanadi.' },
  { question: 'Natijalar qachon e\'lon qilinadi?', answer: 'Natijalar odatda imtihondan 3-5 ish kunlari ichida e\'lon qilinadi. Siz shaxsiy kabinetingizdan ko\'ra olasiz.' },
];

function CountUp({ value, suffix }: { value: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const num = parseInt(value.replace(/[,+]/g, ''));
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 2000;
          const steps = 60;
          const increment = num / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= num) { clearInterval(timer); setCount(num); }
            else { setCount(Math.floor(current)); }
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [num]);

  return <span ref={ref}>{count.toLocaleString()}{value.includes('+') ? '+' : ''}</span>;
}

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const isDark = saved === 'dark' || (!saved && document.documentElement.classList.contains('dark'));
    document.documentElement.classList.toggle('dark', isDark);
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg">
      <title>Olimpiy — Onlayn olimpiada platformasi</title>
      <meta name="description" content="Olimpiy — o'quvchilar uchun onlayn olimpiada platformasi." />

      {/* Apple-style Glass Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5" strokeWidth="1.5"/>
                  <line x1="12" y1="3" x2="12" y2="7"/><line x1="12" y1="17" x2="12" y2="21"/>
                  <line x1="3" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="21" y2="12"/>
                </svg>
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-slate-900 dark:text-white">Olimpiy</span>
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Imkoniyatlar</Link>
              <Link href="#how-it-works" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Qanday ishlaydi</Link>
              <Link href="#faqs" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">FAQ</Link>
              <Link href="/auth" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-500 transition-all shadow-[0_4px_14px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)]">
                Kirish
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={toggleDarkMode} 
                className="p-2.5 rounded-xl bg-white/40 dark:bg-white/[0.06] backdrop-blur-xl border border-white/30 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-all text-slate-500 dark:text-slate-400 shadow-apple-tight" 
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="lg:hidden p-2.5 rounded-xl bg-white/40 dark:bg-white/[0.06] backdrop-blur-xl border border-white/30 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-apple-tight" 
                aria-label="Menyuni ochish/yopish"
              >
                {mobileMenuOpen ? <X className="w-4 h-4 text-slate-700 dark:text-slate-300" /> : <Menu className="w-4 h-4 text-slate-700 dark:text-slate-300" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }} 
              className="lg:hidden border-t border-white/30 dark:border-white/5 overflow-hidden bg-white/90 dark:bg-black/60 backdrop-blur-3xl"
            >
              <div className="flex flex-col gap-1 px-4 py-5">
                <Link href="#features" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-4 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5 transition-all font-medium">Imkoniyatlar</Link>
                <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-4 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5 transition-all font-medium">Qanday ishlaydi</Link>
                <Link href="#faqs" onClick={() => setMobileMenuOpen(false)} className="py-2.5 px-4 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5 transition-all font-medium">FAQ</Link>
                <Link href="/auth" onClick={() => setMobileMenuOpen(false)} className="mt-2 inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-2xl bg-primary-600 text-white text-sm font-medium shadow-[0_4px_14px_rgba(99,102,241,0.3)]">Kirish</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="relative z-10">
        {/* Hero Section - Apple Style */}
        <section className="relative pt-32 lg:pt-40 pb-20 lg:pb-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-500/[0.02] via-transparent to-transparent dark:from-primary-500/[0.04]" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="pill mb-10 inline-flex mx-auto"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                <span>Yangi: QR kodli chiptalar, mobil nazoratchi</span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.1 }} 
                className="font-display font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-slate-900 dark:text-white leading-[1.0] mb-8 tracking-tighter text-balance"
              >
                Olimpiada offline
                <br />
                <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">bosqichini osonlashtiring</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.2 }} 
                className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
              >
                Maktab o'quvchilari uchun offlayn olimpiadalarni boshqarish, ro'yxatdan o'tkazish, 
                to'lov qabul qilish va natijalarni e'lon qilish — barchasi bitta platformada.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.3 }} 
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link 
                  href="/auth" 
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-primary-600 text-white text-base font-semibold hover:bg-primary-500 transition-all shadow-[0_8px_30px_rgba(99,102,241,0.3)] hover:shadow-[0_12px_40px_rgba(99,102,241,0.4)] active:scale-[0.97]"
                >
                  Ro'yxatdan o'tish
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link 
                  href="#how-it-works" 
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl glass-vibrancy text-slate-700 dark:text-slate-300 text-base font-semibold hover:bg-white/60 dark:hover:bg-white/10 transition-all active:scale-[0.97]"
                >
                  Qanday ishlaydi
                </Link>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.4 }} 
                className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-slate-400 dark:text-slate-500"
              >
                {['SMS autentifikatsiya', 'Click & Payme to\'lovi', 'PDF chipta & sertifikat', 'Real vaqtda joylar'].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats - Apple Glass Cards */}
        <section className="py-20 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="glass-card p-8 text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500/10 to-purple-500/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-5">
                    <stat.icon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="font-display font-bold text-3xl lg:text-4xl text-slate-900 dark:text-white mb-1 tabular-nums tracking-tight">
                    <CountUp value={stat.value} />
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{stat.suffix}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features - Apple Grid */}
        <section id="features" className="py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                className="pill inline-flex mx-auto mb-6"
              >
                <Star className="w-3.5 h-3.5 text-primary-500" />
                <span>Asosiy imkoniyatlar</span>
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 10 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ delay: 0.1 }} 
                className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-slate-900 dark:text-white mb-4 tracking-tight"
              >
                Har bir olimpiada uchun{' '}
                <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">to'liq yechim</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 10 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ delay: 0.15 }} 
                className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg"
              >
                O'quvchilar, nazoratchilar va administratorlar uchun mo'ljallangan zamonaviy vositalar to'plami
              </motion.p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="glass-card p-7 lg:p-8 group"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-5 transition-transform group-hover:scale-110 duration-300",
                    feature.gradient
                  )}>
                    <feature.icon className="w-6 h-6 text-slate-700 dark:text-white" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works - Apple Timeline */}
        <section id="how-it-works" className="py-24 lg:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-500/[0.02] to-transparent dark:from-primary-500/[0.03]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                className="pill inline-flex mx-auto mb-6"
              >
                <Zap className="w-3.5 h-3.5 text-primary-500" />
                <span>5 oddiy qadam</span>
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 10 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ delay: 0.1 }} 
                className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-slate-900 dark:text-white mt-4 tracking-tight"
              >
                Qanday ishlaydi?
              </motion.h2>
            </div>

            <div className="relative max-w-3xl mx-auto">
              <div className="absolute left-9 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary-500/30 via-purple-500/30 to-pink-500/30 hidden md:block" />

              <div className="space-y-8 md:space-y-12">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.12 }}
                    className="relative flex gap-6 md:gap-8 items-start group"
                  >
                    <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center shadow-[0_8px_30px_rgba(99,102,241,0.3)] group-hover:shadow-[0_12px_40px_rgba(99,102,241,0.4)] transition-all duration-500">
                      <step.icon className="w-7 h-7 text-white" />
                    </div>

                    <div className="flex-1 min-w-0 pt-3">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-[0.15em]">
                          Qadam {step.number}
                        </span>
                      </div>
                      <h3 className="font-display font-semibold text-xl text-slate-900 dark:text-white">{step.title}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ - Glass Accordion */}
        <section id="faqs" className="py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                className="pill inline-flex mx-auto mb-6"
              >
                <HelpCircle className="w-3.5 h-3.5 text-primary-500" />
                <span>Tez-tez so'raladigan savollar</span>
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 10 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ delay: 0.1 }} 
                className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-slate-900 dark:text-white mt-4 tracking-tight"
              >
                Savollaringiz bormi?
              </motion.h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-3">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.04 }}
                  className="glass-card overflow-hidden"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left focus:outline-none gap-4"
                  >
                    <span className="font-semibold text-slate-900 dark:text-white text-base pr-4">{faq.question}</span>
                    <motion.div
                      animate={{ rotate: activeFaq === index ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/50 dark:bg-white/5 flex items-center justify-center text-slate-400 border border-white/30 dark:border-white/5"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {activeFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="px-6 pb-6 text-slate-500 dark:text-slate-400 leading-relaxed text-sm border-t border-white/20 dark:border-white/5 pt-5"
                      >
                        {faq.answer}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA - Apple Style */}
        <section className="py-24 lg:py-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-slate-900 via-primary-900 to-purple-900 p-12 lg:p-20 shadow-[0_30px_80px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_80px_rgba(0,0,0,0.3)]">
              {/* Ambient glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px]" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-500/10 rounded-full blur-[100px]" />
              
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-[0.03]" style={{ 
                backgroundImage: 'radial-gradient(circle at 25px 25px, white 1px, transparent 0)', 
                backgroundSize: '50px 50px' 
              }} />

              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center mx-auto mb-8 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h2 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-white mb-4 tracking-tight">
                  Bugundan ro'yxatdan o'ting
                </h2>
                <p className="text-primary-200/80 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
                  50,000+ o'quvchi Olimpiy platformasidan foydalangan. Siz ham ularning qatoriga qo'shiling!
                </p>
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-2.5 bg-white text-primary-900 hover:bg-primary-50 px-10 py-4 rounded-2xl text-base font-semibold shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)] transition-all duration-300 group active:scale-[0.97]"
                >
                  <span>Hozir ro'yxatdan o'tish</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Glass */}
      <footer className="border-t border-white/30 dark:border-white/[0.06] bg-white/60 dark:bg-black/40 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-16 grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-14">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5" strokeWidth="1.5"/>
                    <line x1="12" y1="3" x2="12" y2="7"/><line x1="12" y1="17" x2="12" y2="21"/>
                    <line x1="3" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="21" y2="12"/>
                  </svg>
                </div>
                <span className="font-display font-bold text-lg tracking-tight text-slate-900 dark:text-white">Olimpiy</span>
              </Link>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xs">
                Maktab o'quvchilari uchun offlayn olimpiadalarni boshqarish va ro'yxatga olish platformasi.
              </p>
              <div className="flex gap-3 mt-6">
                {[Globe, Mail, Phone].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-xl bg-white/40 dark:bg-white/[0.06] backdrop-blur-xl border border-white/30 dark:border-white/[0.06] flex items-center justify-center hover:bg-primary-500/10 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 shadow-apple-tight">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: 'Mahsulot', links: ['Imkoniyatlar', 'Qanday ishlaydi', 'FAQ', 'Kirish'], hrefs: ['#features', '#how-it-works', '#faqs', '/auth'] },
              { title: 'Qo\'llab-quvvatlash', links: ['Qo\'llanma', 'Aloqa', 'Maxfiylik siyosati', 'Foydalanish shartlari'], hrefs: ['#', '#', '#', '#'] },
              { title: 'Kompaniya', links: ['Biz haqimizda', 'Hamkorlar', 'Blog', 'Ish o\'rinlari'], hrefs: ['#', '#', '#', '#'] },
            ].map((group) => (
              <div key={group.title}>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm">{group.title}</h4>
                <ul className="space-y-3">
                  {group.links.map((link, i) => (
                    <li key={link}>
                      <Link href={group.hrefs[i]} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/30 dark:border-white/[0.06] py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              &copy; 2026 Olimpiy. Barcha huquqlar himoyalangan.
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                O'zbekiston
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span>Toshkent sh.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
