import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Olympiad, Registration, Attendance } from '@/types';

const createSafeStorage = () => typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} };

interface OlympiadState {
  olympiads: Olympiad[];
  activeOlympiads: Olympiad[];
  currentOlympiad: Olympiad | null;
  isLoading: boolean;
  setOlympiads: (olympiads: Olympiad[]) => void;
  setActiveOlympiads: (olympiads: Olympiad[]) => void;
  setCurrentOlympiad: (olympiad: Olympiad | null) => void;
  setLoading: (loading: boolean) => void;
  addOlympiad: (olympiad: Olympiad) => void;
  updateOlympiad: (id: string, data: Partial<Olympiad>) => void;
  removeOlympiad: (id: string) => void;
}

export const useOlympiadStore = create<OlympiadState>((set) => ({
  olympiads: [],
  activeOlympiads: [],
  currentOlympiad: null,
  isLoading: false,
  setOlympiads: (olympiads) => set({ olympiads }),
  setActiveOlympiads: (activeOlympiads) => set({ activeOlympiads }),
  setCurrentOlympiad: (currentOlympiad) => set({ currentOlympiad }),
  setLoading: (isLoading) => set({ isLoading }),
  addOlympiad: (olympiad) => set((state) => ({ olympiads: [olympiad, ...state.olympiads] })),
  updateOlympiad: (id, data) =>
    set((state) => ({
      olympiads: state.olympiads.map((o) => (o.id === id ? { ...o, ...data } : o)),
      currentOlympiad: state.currentOlympiad?.id === id ? { ...state.currentOlympiad, ...data } : state.currentOlympiad,
    })),
  removeOlympiad: (id) =>
    set((state) => ({
      olympiads: state.olympiads.filter((o) => o.id !== id),
      currentOlympiad: state.currentOlympiad?.id === id ? null : state.currentOlympiad,
    })),
}));

interface RegistrationState {
  registrations: Registration[];
  currentRegistration: Registration | null;
  isLoading: boolean;
  setRegistrations: (registrations: Registration[]) => void;
  setCurrentRegistration: (registration: Registration | null) => void;
  addRegistration: (registration: Registration) => void;
  updateRegistration: (id: string, data: Partial<Registration>) => void;
  removeRegistration: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useRegistrationStore = create<RegistrationState>((set) => ({
  registrations: [],
  currentRegistration: null,
  isLoading: false,
  setRegistrations: (registrations) => set({ registrations }),
  setCurrentRegistration: (currentRegistration) => set({ currentRegistration }),
  addRegistration: (registration) => set((state) => ({ registrations: [registration, ...state.registrations] })),
  updateRegistration: (id, data) =>
    set((state) => ({
      registrations: state.registrations.map((r) => (r.id === id ? { ...r, ...data } : r)),
      currentRegistration: state.currentRegistration?.id === id ? { ...state.currentRegistration, ...data } : state.currentRegistration,
    })),
  removeRegistration: (id) =>
    set((state) => ({
      registrations: state.registrations.filter((r) => r.id !== id),
      currentRegistration: state.currentRegistration?.id === id ? null : state.currentRegistration,
    })),
  setLoading: (isLoading) => set({ isLoading }),
}));

interface UIState {
  darkMode: boolean;
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  notifications: Array<{ id: string; type: 'success' | 'error' | 'warning' | 'info'; message: string }>;
  toggleDarkMode: () => void;
  setDarkMode: (mode: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      darkMode: false,
      sidebarOpen: true,
      mobileMenuOpen: false,
      notifications: [],
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setDarkMode: (darkMode) => set({ darkMode }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
      addNotification: (notification) =>
        set((state) => ({
          notifications: [...state.notifications, { ...notification, id: Date.now().toString() }],
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ darkMode: state.darkMode, sidebarOpen: state.sidebarOpen }),
    }
  )
);

interface ProctorState {
  scanHistory: Attendance[];
  currentScan: { registrationId: string; qrToken: string } | null;
  isScanning: boolean;
  setScanHistory: (history: Attendance[]) => void;
  addScan: (scan: Attendance) => void;
  setCurrentScan: (scan: { registrationId: string; qrToken: string } | null) => void;
  setScanning: (scanning: boolean) => void;
}

export const useProctorStore = create<ProctorState>((set) => ({
  scanHistory: [],
  currentScan: null,
  isScanning: false,
  setScanHistory: (scanHistory) => set({ scanHistory }),
  addScan: (scan) => set((state) => ({ scanHistory: [scan, ...state.scanHistory] })),
  setCurrentScan: (currentScan) => set({ currentScan }),
  setScanning: (isScanning) => set({ isScanning }),
}));