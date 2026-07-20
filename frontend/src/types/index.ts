export type Role = 'STUDENT' | 'PROCTOR' | 'ADMIN';
export type RegStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type AttendanceStatus = 'REGISTERED' | 'ATTENDED' | 'ABSENT';
export type PaymentProvider = 'CLICK' | 'PAYME';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
export type Language = 'uz' | 'ru' | 'en';

export interface User {
  id: string;
  phoneNumber: string;
  fullName: string;
  role: Role;
  schoolName?: string;
  grade?: number;
  region?: string;
  district?: string;
  parentPhone?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  avatar?: string;
  avatarUrl?: string;
}

export interface Olympiad {
  id: string;
  title: string;
  subject: string;
  description?: string;
  price: number;
  examDate: string;
  regEndDate: string;
  isActive: boolean;
  maxCapacity?: number;
  createdById?: string;
  updatedById?: string;
  createdAt: string;
  updatedAt: string;
  locations?: OlympiadLocation[];
  _count?: {
    registrations: number;
  };
}

export interface OlympiadLocation {
  id: string;
  olympiadId: string;
  locationId: string;
  isActive: boolean;
  createdAt: string;
  location: Location;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  mapLink?: string;
  contactPhone?: string;
  contactPerson?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  rooms?: Room[];
  _count?: {
    rooms: number;
    registrations: number;
  };
}

export interface Room {
  id: string;
  locationId: string;
  roomNumber: string;
  capacity: number;
  currentSeats: number;
  floor?: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    registrations: number;
  };
}

export interface Registration {
  id: string;
  userId: string;
  user?: User;
  olympiadId: string;
  olympiad?: Olympiad;
  locationId: string;
  location?: Location;
  roomId: string;
  room?: Room;
  seatNumber: number;
  status: RegStatus;
  lang: Language;
  ticketUrl?: string;
  qrCodeToken: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  payment?: Payment;
  attendance?: Attendance;
  result?: Result;
}

export interface Payment {
  id: string;
  registrationId: string;
  registration?: Registration;
  provider: PaymentProvider;
  transactionId: string;
  amount: number;
  status: PaymentStatus;
  payedAt?: string;
  cancelledAt?: string;
  rawRequest?: any;
  rawResponse?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  registrationId: string;
  registration?: Registration;
  status: AttendanceStatus;
  proctorId?: string;
  proctor?: User;
  scannedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Result {
  id: string;
  registrationId: string;
  registration?: Registration;
  score: number;
  rank?: number;
  certificateUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OlympiadStats {
  total: number;
  active: number;
  upcoming: number;
  past: number;
  bySubject: Record<string, number>;
}

export interface RegistrationStats {
  total: number;
  pending: number;
  paid: number;
  cancelled: number;
  byStatus: Record<string, number>;
  byLanguage: Record<string, number>;
}

export interface AttendanceStats {
  total: number;
  attended: number;
  absent: number;
  registered: number;
  attendanceRate: string;
}

export interface ResultStats {
  total: number;
  average: number;
  max: number;
  min: number;
  withCertificate: number;
  distribution: { score: number; count: number }[];
}

export interface ExportRegistrationRow {
  '№': number;
  'F.I.O': string;
  'Telefon': string;
  'Maktab': string;
  'Sinf': string | number;
  'Hudud': string;
  'Tuman': string;
  'Olimpiada': string;
  'Fan': string;
  'Bino': string;
  'Xona': string;
  'Parta': number;
  'Til': string;
  'Holat': string;
  'To\'lov': string;
  'To\'lov ID': string;
  'Summa': number;
  'Keldi': string;
  'Kelgan vaqt': string;
  'Ball': string;
  'O\'rin': string;
}

export interface SendOtpDto {
  phoneNumber: string;
}

export interface VerifyOtpDto {
  phoneNumber: string;
  otp: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface ClickPaymentInit {
  merchantTransId: string;
  serviceId: string;
  amount: number;
}

export interface PaymeReceipt {
  id: string;
  amount: number;
}

export interface ClickWebhookPayload {
  merchant_trans_id: string;
  click_trans_id: string;
  sign_string: string;
  action: number;
  error: number;
  error_note: string;
}

export interface PaymeWebhookPayload {
  id: number;
  method: string;
  params: {
    id: string;
    amount: number;
    account: { registration_id: string };
    time: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  path: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateRegistrationDto {
  olympiadId: string;
  locationId: string;
  roomId?: string;
  lang: Language;
}

export interface CreateOlympiadDto {
  title: string;
  subject: string;
  description?: string;
  price: number;
  examDate: string;
  regEndDate: string;
  isActive?: boolean;
  maxCapacity?: number;
}

export interface UpdateOlympiadDto {
  title?: string;
  subject?: string;
  description?: string;
  price?: number;
  examDate?: string;
  regEndDate?: string;
  isActive?: boolean;
  maxCapacity?: number;
}

export interface CreateLocationDto {
  name: string;
  address: string;
  mapLink?: string;
  contactPhone?: string;
  contactPerson?: string;
}

export interface CreateRoomDto {
  locationId: string;
  roomNumber: string;
  capacity: number;
  floor?: number;
  description?: string;
}

export interface CreateUserDto {
  phoneNumber: string;
  fullName: string;
  role: Role;
  schoolName?: string;
  grade?: number;
  region?: string;
  district?: string;
  parentPhone?: string;
  password?: string;
}

export interface UpdateUserDto {
  fullName?: string;
  schoolName?: string;
  grade?: number;
  region?: string;
  district?: string;
  parentPhone?: string;
  isActive?: boolean;
  role?: Role;
}

export interface AdminFilters {
  role?: Role;
  search?: string;
  isActive?: boolean;
  region?: string;
  district?: string;
  schoolName?: string;
  grade?: number;
  page?: number;
  limit?: number;
}

export interface RegistrationFilters {
  olympiadId?: string;
  status?: RegStatus;
  locationId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ResultFilters {
  olympiadId?: string;
  minScore?: number;
  maxScore?: number;
  hasCertificate?: boolean;
  page?: number;
  limit?: number;
}

export interface OlympiadFilters {
  subject?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}