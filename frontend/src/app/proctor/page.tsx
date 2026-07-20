'use client';


import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Camera, CheckCircle, XCircle, Loader2, ScanLine, Volume2, VolumeX, LogOut, Shield, Clock, Users, Signal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useProctorStore } from '@/store';
import { toast } from '@/hooks/use-toast';
import { formatDate, formatDateTime, getStatusColor, getStatusLabel } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Attendance } from '@/types';

export default function ProctorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { scanHistory, addScan, setCurrentScan, setScanning: setStoreScanning, currentScan, isScanning } = useProctorStore();

  const [selectedOlympiad, setSelectedOlympiad] = useState<string | null>(null);
  const [olympiads, setOlympiads] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const scanningRef = useRef(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null!);
  const scanTimeoutRef = useRef<NodeJS.Timeout>();
  const scanResultTimeoutRef = useRef<NodeJS.Timeout>();
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetchOlympiads();
    checkCameraPermission();
    const savedSound = localStorage.getItem('proctorSound');
    if (savedSound !== null) setSoundEnabled(savedSound === 'true');
    return () => {
      scanningRef.current = false;
      setStoreScanning(false);
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
      if (scanResultTimeoutRef.current) clearTimeout(scanResultTimeoutRef.current);
      if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    };
  }, []);

  const checkCameraPermission = async () => {
    try {
      const perm = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setCameraPermission(perm.state);
      perm.onchange = () => setCameraPermission(perm.state);
    } catch (e) {
      setCameraPermission('prompt');
    }
  };

  const fetchOlympiads = async () => {
    try {
      const res = await api.proctor.getMyOlympiads();
      const olymData = res.data?.data || res.data;
      setOlympiads(Array.isArray(olymData) ? olymData : []);
      if (olymData?.[0] && !selectedOlympiad) {
        setSelectedOlympiad(olymData[0].id);
      }
    } catch (err) {
      console.error('Olympiads fetch error:', err);
      toast({ title: 'Xatolik', description: 'Olimpiadalarni yuklashda xatolik', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedOlympiad) {
      fetchRegistrations(selectedOlympiad);
    }
  }, [selectedOlympiad]);

  const fetchRegistrations = async (olympiadId: string) => {
    try {
      const res = await api.attendance.getOlympiadAttendance(olympiadId);
      const regData = res.data?.data || res.data;
      setRegistrations(Array.isArray(regData) ? regData : []);
    } catch (err) {
      console.error('Registrations fetch error:', err);
      toast({ title: 'Xatolik', description: 'Ro\'yxatni yuklashda xatolik', variant: 'error' });
    }
  };

  const startScanning = async () => {
    if (!videoRef.current) return;
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setStream(mediaStream);
      streamRef.current = mediaStream;
      videoRef.current.srcObject = mediaStream;
      await videoRef.current.play();
      setScanning(true);
      scanningRef.current = true;
      setStoreScanning(true);
      startScanLoop();
    } catch (err) {
      console.error('Camera error:', err);
      setCameraPermission('denied');
      toast({ title: 'Xatolik', description: 'Kamera ruxsati berilmagan', variant: 'error' });
    }
  };

  const stopScanning = () => {
    setScanning(false);
    scanningRef.current = false;
    setStoreScanning(false);
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCurrentScan(null);
  };

  const startScanLoop = () => {
    if (!scanningRef.current || !videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Simple QR detection would go here
      // For now, we'll simulate with a timeout
      scanTimeoutRef.current = setTimeout(() => {
        if (scanningRef.current) startScanLoop();
      }, 1000);
    }
  };

  const handleScanResult = async (qrToken: string) => {
    try {
      const res = await api.attendance.scan(qrToken);
      const wrapper = res.data;
      const data = wrapper?.data || wrapper;
      const success = wrapper?.success ?? false;
      const status = data?.status;
      const message = data?.message;

      const studentName = data?.registration?.user?.fullName;
      const olympiadTitle = data?.registration?.olympiad?.title;
      const locationName = data?.registration?.location?.name;
      const roomNumber = data?.registration?.room?.roomNumber;
      const seatNumber = data?.registration?.seatNumber;
      
      addScan({
        id: Date.now().toString(),
        registrationId: data?.registrationId,
        qrToken,
        timestamp: new Date().toISOString(),
        success,
        status,
        message,
        studentName,
        olympiadTitle,
        locationName,
        roomNumber,
        seatNumber,
      } as unknown as Attendance);

      if (soundEnabled) {
        playSound(success ? 'success' : status === 'already_scanned' ? 'warning' : 'error');
      }

      setCurrentScan({ success, status, message, data, studentName, olympiadTitle, locationName, roomNumber, seatNumber } as unknown as { registrationId: string; qrToken: string });
      
      if (scanResultTimeoutRef.current) clearTimeout(scanResultTimeoutRef.current);
      scanResultTimeoutRef.current = setTimeout(() => setCurrentScan(null), 3000);
      
    } catch (err: unknown) {
      const scanErrMsg = err instanceof Error ? err.message : 'Skanerlashda xatolik';
      console.error('Scan error:', err);
      if (soundEnabled) playSound('error');
      setCurrentScan({ success: false, status: 'error', message: scanErrMsg, data: null } as unknown as { registrationId: string; qrToken: string });
    }
  };

  const playSound = (type: 'success' | 'error' | 'warning') => {
    try {
      const AC: typeof AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AC();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (type === 'success') {
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        oscillator.start();
        setTimeout(() => { oscillator.frequency.value = 1000; }, 100);
        setTimeout(() => { oscillator.stop(); }, 300);
      } else if (type === 'warning') {
        oscillator.frequency.value = 400;
        oscillator.type = 'square';
        gainNode.gain.value = 0.3;
        oscillator.start();
        setTimeout(() => { oscillator.frequency.value = 300; }, 200);
        setTimeout(() => { oscillator.stop(); }, 500);
      } else {
        oscillator.frequency.value = 200;
        oscillator.type = 'sawtooth';
        gainNode.gain.value = 0.3;
        oscillator.start();
        setTimeout(() => { oscillator.stop(); }, 500);
      }
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  };

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // In a real app, you'd use a QR code reader library to decode the image
    // For now, we'll just show a message
    toast({ title: 'Fayl yuklandi', description: 'QR kod o\'qish funksiyasi ishlab chiqilmoqda', variant: 'info' });
    e.target.value = '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <title>Yuklanmoqda — Proktor | Olimpiy</title>
      <meta name="description" content="Proktor paneli — olimpiada qatnashchilarini QR kod orqali skanerlash." />
        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex">
      <title>Proktor paneli — Olimpiy</title>
      <meta name="description" content="Proktor paneli — olimpiada qatnashchilarini QR kod orqali skanerlash." />
      {/* Sidebar */}
      <aside className="fixed lg:left-0 top-0 h-screen w-64 bg-white dark:bg-dark-card border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col z-40">
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-slate-900 dark:text-white">Nazoratchi</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.fullName}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <OlympiadSelector olympiads={olympiads} selected={selectedOlympiad} onSelect={setSelectedOlympiad} loading={loading} />
        </nav>

        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={soundEnabled} onChange={e => { setSoundEnabled(e.target.checked); localStorage.setItem('proctorSound', e.target.checked.toString()); }} className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-slate-700 dark:text-slate-300">Tovushli xabarlar</span>
            </label>
            <Button variant="outline" className="w-full" onClick={() => { useAuthStore.getState().logout(); }}>
              <LogOut className="w-4 h-4 mr-2" /> Chiqish
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <h1 className="font-display font-semibold text-xl text-slate-900 dark:text-white">
                {selectedOlympiad ? olympiads.find(o => o.id === selectedOlympiad)?.title : 'Olimpiada tanlang'}
              </h1>
              {selectedOlympiad && (
                <Badge variant="success" className="ml-2">Faol skanerlash</Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Signal className="w-4 h-4" />
                <span>Onlayn</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {user?.fullName?.charAt(0)?.toUpperCase() ?? ''}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          {selectedOlympiad ? (
            <ScannerView 
              olympiad={olympiads.find(o => o.id === selectedOlympiad)!}
              registrations={registrations}
              scanning={scanning}
              currentScan={currentScan}
              videoRef={videoRef}
              onStartScan={startScanning}
              onStopScan={stopScanning}
              soundEnabled={soundEnabled}
              setSoundEnabled={setSoundEnabled}
              cameraPermission={cameraPermission}
              onFileScan={handleFileScan}
            />
          ) : (
            <EmptyState>
              <Camera className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <h2 className="font-display font-semibold text-xl text-slate-900 dark:text-white mb-2">Olimpiada tanlang</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">Skanerlashni boshlash uchun chap panelda olimpiada tanlang</p>
              <OlympiadSelector olympiads={olympiads} selected={selectedOlympiad} onSelect={setSelectedOlympiad} loading={loading} inline />
            </EmptyState>
          )}

          {/* Scan History */}
          <Card className="gradient-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Skanerlash tarixi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                {scanHistory.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <ScanLine className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Hozircha skanerlash tarixi yo'q</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {scanHistory.slice().reverse().slice(0, 20).map((scan: any) => (
                      <ScanHistoryItem key={scan.id} scan={scan} />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function OlympiadSelector({ olympiads, selected, onSelect, loading, inline = false }: { olympiads: any[]; selected: string | null; onSelect: (id: string) => void; loading: boolean; inline?: boolean }) {
  if (loading && olympiads.length === 0) {
    return <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  const content = (
    <div className={cn('space-y-2', inline ? '' : '')}>
      {olympiads.map((olympiad: any) => (
        <button
          key={olympiad.id}
          onClick={() => onSelect(olympiad.id)}
          className={cn(
            'w-full text-left p-3 rounded-xl transition-all',
            selected === olympiad.id
              ? 'bg-primary-50 dark:bg-primary-900/30 border border-primary-500'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
          )}
        >
          <h4 className="font-medium text-slate-900 dark:text-white">{olympiad.title}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{olympiad.subject} • {formatDate(olympiad.examDate)}</p>
        </button>
      ))}
    </div>
  );

  return inline ? content : (
    <div>
      <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Olimpiadalar</h3>
      {content}
    </div>
  );
}

function ScannerView({ olympiad, registrations, scanning, currentScan, videoRef, onStartScan, onStopScan, soundEnabled, setSoundEnabled, cameraPermission, onFileScan }: {
  olympiad: any; registrations: any[]; scanning: boolean; currentScan: any;
  videoRef: React.RefObject<HTMLVideoElement>;
  onStartScan: () => void; onStopScan: () => void;
  soundEnabled: boolean; setSoundEnabled: (v: boolean) => void;
  cameraPermission: string; onFileScan: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const stats = {
    total: registrations.length,
    attended: registrations.filter((r: any) => r.attendance?.status === 'ATTENDED').length,
    absent: registrations.filter((r: any) => r.attendance?.status === 'ABSENT').length,
    pending: registrations.filter((r: any) => r.attendance?.status === 'REGISTERED').length,
  };

  return (
    <div className="space-y-6">
      {/* Olympiad Header */}
      <Card className="gradient-border">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white">{olympiad.title}</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">{olympiad.subject} • {formatDate(olympiad.examDate)} • {formatDateTime(olympiad.examDate).split(', ')[1]}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <StatBadge label="Jami" value={stats.total} color="primary" icon={Users} />
              <StatBadge label="Keldi" value={stats.attended} color="success" icon={CheckCircle} />
              <StatBadge label="Kelmadi" value={stats.absent} color="error" icon={XCircle} />
              <StatBadge label="Kutilmoqda" value={stats.pending} color="warning" icon={Clock} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scanner */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="gradient-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ScanLine className="w-5 h-5" />
                QR Kod skanerlash
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                {scanning && videoRef.current ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <ScanLine className="w-16 h-16 mb-4" />
                    <p className="text-lg">Kamera yoqilmagan</p>
                    <p className="text-sm mt-1">Skanerlashni boshlash uchun tugmani bosing</p>
                  </div>
                )}
                
                {currentScan && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10 animate-fade-in">
                    <div className={cn(
                      'p-6 rounded-xl max-w-md w-full mx-4 text-center animate-scale-in',
                      currentScan.success ? 'bg-green-500/90' : 'bg-red-500/90'
                    )}>
                      <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4', currentScan.success ? 'bg-green-100' : 'bg-red-100')}>
                        {currentScan.success ? (
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        ) : (
                          <XCircle className="w-8 h-8 text-red-600" />
                        )}
                      </div>
                      <h3 className="font-display font-bold text-2xl text-white mb-2">
                        {currentScan.success ? 'Muvaffaqiyatli!' : 'Xatolik'}
                      </h3>
                      <p className="text-white/90 mb-4">{currentScan.message}</p>
                      {currentScan.data && (
                        <div className="text-left text-white/90 space-y-1">
                          <p><strong>Talaba:</strong> {currentScan.studentName}</p>
                          <p><strong>Olimpiada:</strong> {currentScan.olympiadTitle}</p>
                          <p><strong>Xona:</strong> {currentScan.locationName} - {currentScan.roomNumber}</p>
                          <p><strong>Parta:</strong> {currentScan.seatNumber}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {!scanning ? (
                    <Button 
                      onClick={onStartScan} 
                      size="lg" 
                      className="flex-1 sm:flex-none"
                      disabled={cameraPermission === 'denied'}
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      {cameraPermission === 'denied' ? 'Kamera ruxsati yo\'q' : 'Skanerlashni boshlash'}
                    </Button>
                  ) : (
                    <Button onClick={onStopScan} variant="destructive" size="lg" className="flex-1 sm:flex-none">
                      <XCircle className="w-5 h-5 mr-2" />
                      To'xtatish
                    </Button>
                  )}
                  <label className="btn-outline flex-1 sm:flex-none cursor-pointer">
                    <input type="file" accept="image/*" onChange={onFileScan} className="hidden" />
                    <span className="flex items-center justify-center gap-2">
                      <Camera className="w-5 h-5" />
                      Rasm yuklash
                    </span>
                  </label>
                </div>
                {cameraPermission === 'denied' && (
                  <p className="text-center text-sm text-red-600 dark:text-red-400 mt-2">
                    Kamera ruxsati berilmagan. Brauzer sozlamalaridan ruxsat bering.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sound toggle */}
          <Card className="gradient-border">
            <CardContent className="p-4">
              <label className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', soundEnabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-100 dark:bg-slate-800')}>
                    {soundEnabled ? <Volume2 className="w-5 h-5 text-green-600" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Tovushli xabarlar</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Natija haqida tovushli xabar berish</p>
                  </div>
                </div>
                <button
                  onClick={() => { const v = !soundEnabled; setSoundEnabled(v); localStorage.setItem('proctorSound', String(v)); }}
                  className={cn('relative w-12 h-7 rounded-full transition-colors', soundEnabled ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600')}
                  aria-label={soundEnabled ? 'O\'chirish' : 'Yoqish'}
                >
                  <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform', soundEnabled ? 'right-1 translate-x-5' : 'left-1')} />
                </button>
              </label>
            </CardContent>
          </Card>
        </div>

        {/* Registrations List */}
        <div className="space-y-4">
          <Card className="gradient-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Ro'yxatdan o'tganlar ({registrations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white dark:bg-dark-card">
                    <tr className="border-b border-slate-200/50 dark:border-slate-800/50">
                      <th className="p-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Talaba</th>
                      <th className="p-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Xona/Parta</th>
                      <th className="p-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Holat</th>
                      <th className="p-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vaqt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
                    {registrations.slice(0, 50).map((reg: any) => (
                      <tr key={reg.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3">
                          <div className="font-medium text-slate-900 dark:text-white">{reg.user?.fullName}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{reg.user?.phoneNumber} • {reg.user?.schoolName}</div>
                        </td>
                        <td className="p-3 text-sm text-slate-600 dark:text-slate-400">
                          {reg.location?.name} / {reg.room?.roomNumber} - {reg.seatNumber}-parta
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={getStatusColor(reg.attendance?.status || 'REGISTERED')}>
                            {getStatusLabel(reg.attendance?.status || 'REGISTERED')}
                          </Badge>
                        </td>
                        <td className="p-3 text-center text-xs text-slate-500 dark:text-slate-400">
                          {reg.attendance?.scannedAt ? formatDateTime(reg.attendance.scannedAt) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {registrations.length > 50 && (
                  <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                    Va {registrations.length - 50} ta ko'rsatilmagan...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatBadge({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: React.ComponentType<{ className?: string }> }) {
  const colors: Record<string, string> = {
    primary: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800',
    success: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    error: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
  };
  return (
    <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium', colors[color])}>
      <Icon className="w-4 h-4" />
      <span>{label}: <strong>{value}</strong></span>
    </div>
  );
}

function ScanHistoryItem({ scan }: { scan: { id: string; success: boolean; status?: string; studentName?: string; olympiadTitle?: string; locationName?: string; roomNumber?: string; seatNumber?: string; timestamp: string } }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', scan.success ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30')}>
            {scan.success ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">{scan.studentName || 'Noma\'lum'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{scan.olympiadTitle} • {scan.locationName} / {scan.roomNumber} • {scan.seatNumber}-parta</p>
          </div>
        </div>
        <div className="text-right">
          <Badge variant={scan.success ? 'success' : 'error'} className="text-xs">{scan.status}</Badge>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{formatDateTime(scan.timestamp)}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      {children}
    </div>
  );
}