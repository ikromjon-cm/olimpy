'use client';
import { useEffect, useState } from 'react';
import { Bell, Shield, Globe, Moon, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Settings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  darkMode: 'system' | 'light' | 'dark';
  language: 'uz' | 'ru' | 'en';
}

const DEFAULT_SETTINGS: Settings = {
  emailNotifications: true,
  smsNotifications: false,
  darkMode: 'system',
  language: 'uz',
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('olimpiy-settings');
      if (stored) {
        const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } as Settings;
        setSettings(parsed);
        applyDarkMode(parsed.darkMode);
      } else {
        applyDarkMode(settings.darkMode);
      }
    } catch {
      applyDarkMode(settings.darkMode);
    }
  }, []);

  const applyDarkMode = (mode: Settings['darkMode']) => {
    if (mode === 'dark') document.documentElement.classList.add('dark');
    else if (mode === 'light') document.documentElement.classList.remove('dark');
    else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.matches) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  };

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('olimpiy-settings', JSON.stringify(settings));
      applyDarkMode(settings.darkMode);
      setSaved(true);
      toast({ title: 'Sozlamalar saqlandi' });
    } catch {
      toast({ title: 'Xatolik', description: 'Sozlamalarni saqlashda xatolik yuz berdi', variant: 'error' });
    }
  };

  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-label={label}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
          checked ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'
        )}
      >
        <span className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
        )} />
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <title>Sozlamalar — Olimpiy</title>
      <meta name="description" content="Hisob va ilova sozlamalarini boshqaring." />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">Sozlamalar</h1>
          <p className="text-sm text-slate-500">Hisob va ilova sozlamalarini boshqaring</p>
        </div>
        {!saved && <Button onClick={handleSave} size="sm"><Save className="w-4 h-4 mr-2" />Saqlash</Button>}
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> Bildirishnomalar</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Toggle checked={settings.emailNotifications} onChange={v => update('emailNotifications', v)} label="Email bildirishnomalar" />
          <Toggle checked={settings.smsNotifications} onChange={v => update('smsNotifications', v)} label="SMS bildirishnomalar" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Moon className="w-5 h-5" /> Tashqi ko'rinish</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Qorong'i rejim</span>
          <Select value={settings.darkMode} onValueChange={v => update('darkMode', v as 'dark' | 'light' | 'system')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="system">Tizim sozlamasi bo'yicha</SelectItem>
              <SelectItem value="light">Och</SelectItem>
              <SelectItem value="dark">Qorong'i</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" /> Til</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Interfeys tili</span>
          <Select value={settings.language} onValueChange={v => update('language', v as 'uz' | 'ru' | 'en')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="uz">O'zbekcha</SelectItem>
              <SelectItem value="ru">Русский</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> Maxfiylik</CardTitle></CardHeader>
        <CardContent>
          <p className="text-slate-500 text-sm">Ma'lumotlaringiz uchinchi shaxslarga uzatilmaydi. Batafsil ma'lumot uchun maxfiylik siyosatiga qarang.</p>
        </CardContent>
      </Card>
    </div>
  );
}
