import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getErrorMessage } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
export const BASE_URL = API_URL.replace('/api/v1', '');

export const baseApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

baseApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

baseApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const body = response.data?.data || response.data;
        const { accessToken, refreshToken: newRefreshToken } = body;

        useAuthStore.getState().setAuth({
          user: useAuthStore.getState().user!,
          accessToken,
          refreshToken: newRefreshToken,
        });

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return baseApi(originalRequest);
      } catch (refreshError) {
        useAuthStore.setState({
          user: null, accessToken: null, refreshToken: null, isAuthenticated: false,
        });
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
          window.location.href = '/auth';
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      useAuthStore.setState({
        user: null, accessToken: null, refreshToken: null, isAuthenticated: false,
      });
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
        window.location.href = '/auth';
      }
    }

    const message = getErrorMessage(error.response?.data || error.message);
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  sendOtp: (phoneNumber: string) => baseApi.post('/auth/send-otp', { phoneNumber }),
  verifyOtp: (phoneNumber: string, otp: string) => baseApi.post('/auth/verify-otp', { phoneNumber, otp }),
  refresh: (refreshToken: string) => baseApi.post('/auth/refresh', { refreshToken }),
  logout: () => baseApi.post('/auth/logout'),
  me: () => baseApi.get('/auth/me'),
  resetPassword: (data: any) => baseApi.post('/auth/reset-password', data),
  adminPasscodeLogin: (passcode: string) => baseApi.post('/auth/admin-login', { passcode }),
};

export const olympiadApi = {
  getAll: (params?: { subject?: string; isActive?: boolean; page?: number; limit?: number }) =>
    baseApi.get('/olympiads', { params }),
  getAllAdmin: (params?: { subject?: string; isActive?: boolean; search?: string; page?: number; limit?: number }) =>
    baseApi.get('/olympiads/admin', { params }),
  getActive: () => baseApi.get('/olympiads/active'),
  getSubjects: () => baseApi.get('/olympiads/subjects'),
  getOne: (id: string) => baseApi.get(`/olympiads/${id}`),
  getOneAdmin: (id: string) => baseApi.get(`/olympiads/admin/${id}`),
  getStats: () => baseApi.get('/olympiads/admin/stats'),
  create: (data: any) => baseApi.post('/olympiads/admin', data),
  update: (id: string, data: any) => baseApi.put(`/olympiads/admin/${id}`, data),
  delete: (id: string) => baseApi.delete(`/olympiads/admin/${id}`),
  toggleActive: (id: string) => baseApi.put(`/olympiads/admin/${id}/toggle`),
  addLocation: (id: string, locationId: string) => baseApi.post(`/olympiads/admin/${id}/locations`, { locationId }),
  removeLocation: (id: string, locationId: string) => baseApi.delete(`/olympiads/admin/${id}/locations/${locationId}`),
};

export const registrationApi = {
  create: (data: { olympiadId: string; locationId: string; roomId?: string; lang: string }) =>
    baseApi.post('/registrations', data),
  getMine: () => baseApi.get('/registrations'),
  getAvailableLocations: (olympiadId: string) => baseApi.get(`/registrations/available-locations/${olympiadId}`),
  getOne: (id: string) => baseApi.get(`/registrations/${id}`),
  getByQr: (qrCodeToken: string) => baseApi.get(`/registrations/qr/${qrCodeToken}`),
  generateTicket: (id: string) => baseApi.post(`/registrations/${id}/ticket`),
  cancel: (id: string) => baseApi.delete(`/registrations/${id}`),
};

export const paymentApi = {
  clickPrepare: (registrationId: string) => baseApi.post('/payments/click/prepare', { registrationId }),
  paymeCreateReceipt: (registrationId: string) => baseApi.post('/payments/payme/create-receipt', { registrationId }),
  getStatus: (registrationId: string) => baseApi.get(`/payments/status/${registrationId}`),
  getMyPayments: () => baseApi.get('/payments/my-payments'),
};

export const attendanceApi = {
  scan: (qrCodeToken: string) => baseApi.post('/attendance/scan', { qrCodeToken }),
  getByRegistration: (registrationId: string) => baseApi.get(`/attendance/registration/${registrationId}`),
  getOlympiadAttendance: (olympiadId: string, params?: { locationId?: string; roomId?: string; status?: string }) =>
    baseApi.get(`/attendance/olympiad/${olympiadId}`, { params }),
  getStats: (olympiadId: string) => baseApi.get(`/attendance/olympiad/${olympiadId}/stats`),
  markAbsent: (registrationId: string, notes?: string) => baseApi.post(`/attendance/${registrationId}/absent`, { notes }),
};

export const resultsApi = {
  getMyResults: () => baseApi.get('/results/my-results'),
  getByRegistration: (registrationId: string) => baseApi.get(`/results/registration/${registrationId}`),
  getCertificate: (registrationId: string) => baseApi.get(`/results/certificate/${registrationId}`),
  create: (data: { registrationId: string; score: number; rank?: number }) => baseApi.post('/results/admin/create', data),
  bulkCreate: (results: { registrationId: string; score: number; rank?: number }[]) => baseApi.post('/results/admin/bulk', { results }),
  getOlympiadResults: (olympiadId: string, params?: { minScore?: number; maxScore?: number }) =>
    baseApi.get(`/results/admin/olympiad/${olympiadId}`, { params }),
  getStats: (olympiadId: string) => baseApi.get(`/results/admin/olympiad/${olympiadId}/stats`),
  generateCertificates: (olympiadId: string, topCount?: number) => baseApi.post(`/results/admin/olympiad/${olympiadId}/generate-certificates`, { topCount }),
  update: (id: string, data: { score?: number; rank?: number }) => baseApi.put(`/results/admin/${id}`, data),
  delete: (id: string) => baseApi.delete(`/results/admin/${id}`),
};

export const filesApi = {
  downloadTicket: (registrationId: string) => baseApi.get(`/files/ticket/${registrationId}`, { responseType: 'blob' }),
  downloadCertificate: (registrationId: string) => baseApi.get(`/files/certificate/${registrationId}`, { responseType: 'blob' }),
};

export const adminApi = {
  getDashboard: () => baseApi.get('/admin/dashboard'),
  getUsers: (params?: { role?: string; search?: string; page?: number; limit?: number }) => baseApi.get('/admin/users', { params }),
  updateUserRole: (userId: string, role: string) => baseApi.post(`/admin/users/${userId}/role`, { role }),
  toggleUserStatus: (userId: string) => baseApi.post(`/admin/users/${userId}/toggle-status`),
  createLocation: (data: any) => baseApi.post('/admin/locations', data),
  updateLocation: (id: string, data: any) => baseApi.put(`/admin/locations/${id}`, data),
  deleteLocation: (id: string) => baseApi.delete(`/admin/locations/${id}`),
  getLocations: () => baseApi.get('/admin/locations'),
  getLocation: (id: string) => baseApi.get(`/admin/locations/${id}`),
  createRoom: (data: any) => baseApi.post('/admin/rooms', data),
  bulkCreateRooms: (data: { locationId: string; rooms: any[] }) => baseApi.post('/admin/rooms/bulk', data),
  updateRoom: (id: string, data: any) => baseApi.put(`/admin/rooms/${id}`, data),
  deleteRoom: (id: string) => baseApi.delete(`/admin/rooms/${id}`),
  getRooms: (locationId: string) => baseApi.get(`/admin/rooms/${locationId}`),
  getSettings: () => baseApi.get('/admin/settings'),
  updateSetting: (key: string, value: any) => baseApi.post('/admin/settings', { key, value }),
  getAuditLogs: (params?: any) => baseApi.get('/admin/audit-logs', { params }),
  exportRegistrations: (olympiadId: string) => baseApi.get(`/registrations/admin/export/${olympiadId}`, { responseType: 'blob' }),
};

export const proctorApi = {
  getMyOlympiads: () => baseApi.get('/proctor/olympiads'),
  getOlympiad: (id: string) => baseApi.get(`/proctor/olympiads/${id}`),
  getRegistrations: (olympiadId: string, params?: any) => baseApi.get(`/proctor/olympiads/${olympiadId}/registrations`, { params }),
  getMyStats: () => baseApi.get('/proctor/my-stats'),
  getMyScans: (limit?: number) => baseApi.get('/proctor/my-scans', { params: { limit } }),
};

export const userApi = {
  getProfile: () => baseApi.get('/users/me'),
  updateProfile: (data: any) => baseApi.put('/users/me', data),
};

export const regionApi = {
  getRegions: () => baseApi.get('/regions'),
  getDistricts: (regionId: string) => baseApi.get(`/regions/${regionId}/districts`),
};

const extendedApi = baseApi as typeof baseApi & {
  auth: typeof authApi;
  olympiads: typeof olympiadApi;
  registrations: typeof registrationApi;
  payments: typeof paymentApi;
  attendance: typeof attendanceApi;
  results: typeof resultsApi;
  files: typeof filesApi;
  admin: typeof adminApi;
  proctor: typeof proctorApi;
  userApi: typeof userApi;
  regions: typeof regionApi;
};
extendedApi.auth = authApi;
extendedApi.olympiads = olympiadApi;
extendedApi.registrations = registrationApi;
extendedApi.payments = paymentApi;
extendedApi.attendance = attendanceApi;
extendedApi.results = resultsApi;
extendedApi.files = filesApi;
extendedApi.admin = adminApi;
extendedApi.proctor = proctorApi;
extendedApi.userApi = userApi;
extendedApi.regions = regionApi;

export { extendedApi as api };
export default extendedApi;