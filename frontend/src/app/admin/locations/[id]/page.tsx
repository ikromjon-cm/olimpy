'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Plus, Trash2, DoorOpen } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { validatePositiveNumber } from '@/lib/utils';

export default function EditLocationPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    mapLink: '',
    contactPhone: '',
    contactPerson: '',
  });
  const [rooms, setRooms] = useState<any[]>([]);
  const [newRoom, setNewRoom] = useState({ roomNumber: '', capacity: '', floor: '' });
  const [addingRoom, setAddingRoom] = useState(false);
  const [roomErrors, setRoomErrors] = useState('');

  useEffect(() => {
    fetchLocation();
    fetchRooms();
  }, [params.id]);

  const fetchLocation = async () => {
    try {
      const res = await api.admin.getLocation(params.id as string);
      const location = res.data.data || res.data;
      if (location) {
        setFormData({
          name: location.name || '',
          address: location.address || '',
          mapLink: location.mapLink || '',
          contactPhone: location.contactPhone || '',
          contactPerson: location.contactPerson || '',
        });
      } else {
        toast({ title: 'Xatolik', description: 'Bino topilmadi', variant: 'error' });
        router.push('/admin/locations');
      }
    } catch (err: unknown) {
      toast({ title: 'Xatolik', description: err instanceof Error ? err.message : 'Xatolik yuz berdi', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await api.admin.getRooms(params.id as string);
      
      let arr = [];
      if (Array.isArray(res.data?.data?.data)) arr = res.data.data.data;
      else if (Array.isArray(res.data?.data)) arr = res.data.data;
      else if (Array.isArray(res.data)) arr = res.data;
      
      setRooms(arr);
    } catch (err) { console.error('Failed to fetch rooms:', err); toast({ title: 'Xatolik', description: 'Xonalarni yuklashda xatolik', variant: 'error' }); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.admin.updateLocation(params.id as string, formData);
      toast({ title: "Bino yangilandi", variant: 'success' });
      router.push('/admin/locations');
    } catch (err: unknown) {
      toast({ title: 'Xatolik', description: err instanceof Error ? err.message : 'Xatolik yuz berdi', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddRoom = async () => {
    if (!newRoom.roomNumber || !newRoom.capacity) return;
    const capErr = validatePositiveNumber(newRoom.capacity, 'Xona sig\'imi');
    if (capErr) { setRoomErrors(capErr); return; }
    setRoomErrors('');
    setAddingRoom(true);
    try {
      await api.admin.createRoom({
        locationId: params.id as string,
        roomNumber: newRoom.roomNumber,
        capacity: Number(newRoom.capacity),
        floor: newRoom.floor ? Number(newRoom.floor) : undefined,
      });
      toast({ title: 'Xona qo\'shildi', variant: 'success' });
      setNewRoom({ roomNumber: '', capacity: '', floor: '' });
      fetchRooms();
    } catch (err: unknown) {
      toast({ title: 'Xatolik', description: err instanceof Error ? err.message : 'Xatolik yuz berdi', variant: 'error' });
    } finally {
      setAddingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await api.admin.deleteRoom(roomId);
      toast({ title: 'Xona o\'chirildi', variant: 'success' });
      fetchRooms();
    } catch (err: unknown) {
      toast({ title: 'Xatolik', description: err instanceof Error ? err.message : 'Xatolik yuz berdi', variant: 'error' });
    }
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-1/4" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <title>Binoni tahrirlash — Olimpiy Admin</title>
      <meta name="description" content="Binoni tahrirlash va xonalarni boshqarish." />
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Orqaga">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="font-display font-bold text-2xl">Binoni tahrirlash</h1>
          <p className="text-slate-500">Bino va xonalar ma'lumotlarini o'zgartiring</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">Bino nomi</label>
                    <Input id="name" name="name" required value={formData.name} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="address" className="text-sm font-medium">Manzil</label>
                    <Input id="address" name="address" required value={formData.address} onChange={handleChange} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="mapLink" className="text-sm font-medium">Xarita havolasi</label>
                    <Input id="mapLink" name="mapLink" value={formData.mapLink} onChange={handleChange} placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contactPerson" className="text-sm font-medium">Mas'ul shaxs</label>
                    <Input id="contactPerson" name="contactPerson" value={formData.contactPerson} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contactPhone" className="text-sm font-medium">Telefon</label>
                    <Input id="contactPhone" name="contactPhone" value={formData.contactPhone} onChange={handleChange} />
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <Link href="/admin/locations"><Button variant="outline">Bekor qilish</Button></Link>
                  <Button type="submit" disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />Saqlash
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><DoorOpen className="w-5 h-5" />Xonalar ({rooms.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {rooms.length === 0 && <p className="text-slate-500 text-sm text-center py-8">Xonalar mavjud emas</p>}
                {rooms.map((room: any) => (
                  <div key={room.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <DoorOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium">{room.roomNumber}</p>
                        <p className="text-sm text-slate-500">Sig'im: {room.capacity} {room.floor ? `• ${room.floor}-qavat` : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{room._count?.registrations || 0} ta</Badge>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteRoom(room.id)} className="text-red-500 hover:text-red-700" aria-label="Xonani o'chirish">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                <h4 className="font-medium mb-3">Yangi xona qo'shish</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                  <Input placeholder="Xona raqami" value={newRoom.roomNumber} onChange={e => setNewRoom(p => ({...p, roomNumber: e.target.value}))} />
                  <Input type="number" placeholder="Sig'im" value={newRoom.capacity} onChange={e => setNewRoom(p => ({...p, capacity: e.target.value}))} />
                  <Input type="number" placeholder="Qavat" value={newRoom.floor} onChange={e => setNewRoom(p => ({...p, floor: e.target.value}))} />
                  <Button onClick={handleAddRoom} disabled={addingRoom || !newRoom.roomNumber || !newRoom.capacity}>
                    <Plus className="w-4 h-4 mr-1" />Qo'shish
                  </Button>
                </div>
                  {roomErrors && <p className="text-sm text-red-500">{roomErrors}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
