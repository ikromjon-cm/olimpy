import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('998')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10)}`;
  }
  if (cleaned.length === 9) {
    return `+998 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('uz-UZ').format(num) + ' so\'m';
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('uz-UZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Hozir';
  if (diffMins < 60) return `${diffMins} daqiqa oldin`;
  if (diffHours < 24) return `${diffHours} soat oldin`;
  if (diffDays < 7) return `${diffDays} kun oldin`;
  return formatDate(d);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'gold' | 'secondary';

export function getStatusColor(status: string): BadgeVariant {
  const colors: Record<string, BadgeVariant> = {
    PENDING: 'warning',
    PAID: 'success',
    CANCELLED: 'error',
    REGISTERED: 'info',
    ATTENDED: 'success',
    ABSENT: 'error',
    SUCCESS: 'success',
    FAILED: 'error',
  };
  return colors[status] || 'default';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Kutilmoqda',
    PAID: 'To\'langan',
    CANCELLED: 'Bekor qilingan',
    REGISTERED: 'Ro\'yxatdan o\'tgan',
    ATTENDED: 'Keldi',
    ABSENT: 'Kelmadi',
    SUCCESS: 'Muvaffaqiyatli',
    FAILED: 'Xatolik',
  };
  return labels[status] || status;
}

export function getLanguageLabel(lang: string): string {
  const labels: Record<string, string> = {
    uz: 'O\'zbekcha',
    ru: 'Русский',
    en: 'English',
  };
  return labels[lang] || lang;
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    STUDENT: 'O\'quvchi',
    PROCTOR: 'Nazoratchi',
    ADMIN: 'Admin',
  };
  return labels[role] || role;
}

export function downloadFile(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function getErrorMessage(error: unknown, fallback = 'Xatolik yuz berdi'): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as Record<string, unknown>).message);
  }
  return fallback;
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 9 || (cleaned.length === 12 && cleaned.startsWith('998'));
}

export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('998')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.length === 9) {
    return `998${cleaned}`;
  }
  if (cleaned.length > 1) {
    const last9 = cleaned.slice(-9);
    return `998${last9}`;
  }
  return '998' + cleaned.padStart(9, '0');
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename).toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
}

export function isPdfFile(filename: string): boolean {
  return getFileExtension(filename).toLowerCase() === 'pdf';
}

export function validatePositiveNumber(value: string | number, label: string): string | undefined {
  const num = typeof value === 'string' ? Number(value) : value;
  if (isNaN(num) || num <= 0) return `${label} musbat son bo'lishi kerak`;
}

export function validateDateOrder(before: string, after: string, beforeLabel: string, afterLabel: string): string | undefined {
  if (!before || !after) return;
  if (new Date(before) >= new Date(after)) return `${beforeLabel} ${afterLabel} dan oldin bo'lishi kerak`;
}