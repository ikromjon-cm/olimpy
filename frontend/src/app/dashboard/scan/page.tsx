'use client';
import { useState, useRef } from 'react';
import { Camera, ScanLine, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ScanPage() {
  const [token, setToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<{ user?: { fullName?: string; phoneNumber?: string }; fullName?: string; phoneNumber?: string } | null>(null);
  const scanningRef = useRef(false);

  const handleManualScan = async () => {
    if (!token.trim() || scanningRef.current) return;
    const qrToken = token.trim();
    scanningRef.current = true;
    setScanning(true);
    try {
      const res = await api.attendance.scan(qrToken);
      const data = res.data?.data ?? res.data;
      if (data) {
        setLastResult(data);
        toast({ title: 'Davomat belgilandi', description: `${data.user?.fullName || data.fullName || ''} uchun` });
      }
      setToken('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? (err as any)?.response?.data?.message || err.message : 'Xatolik yuz berdi';
      toast({ title: 'Xatolik', description: msg, variant: 'error' });
    } finally {
      setScanning(false);
      scanningRef.current = false;
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <title>QR skaner — Olimpiy</title>
      <meta name="description" content="QR kod orqali davomatni belgilash." />
      <div>
        <h1 className="font-display font-bold text-2xl">QR skaner</h1>
        <p className="text-sm text-slate-500">QR kod orqali davomatni belgilash</p>
      </div>

      <Card className="overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary-600 to-secondary-500" />
        <CardHeader><CardTitle className="flex items-center gap-2"><ScanLine className="w-5 h-5" /> QR kodni o'qish</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 to-secondary-500/5" />
            <div className="relative text-center">
              <Camera className="w-16 h-16 mx-auto mb-3 text-slate-400" />
              <p className="text-sm text-slate-500">QR kodni kameraga tuting yoki token ni qo'lda kiriting</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="QR token..."
              value={token}
              onChange={e => setToken(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !scanningRef.current) handleManualScan(); }}
              className="flex-1"
            />
            <Button onClick={handleManualScan} disabled={scanning || !token.trim()}>
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tekshirish'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {lastResult && (
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{lastResult?.user?.fullName || lastResult?.fullName}</p>
              <p className="text-sm text-slate-500 truncate">{lastResult?.user?.phoneNumber || lastResult?.phoneNumber}</p>
            </div>
            <Badge variant="success">Tasdiqlandi</Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
