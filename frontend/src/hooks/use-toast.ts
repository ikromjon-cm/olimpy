'use client';

import { useState, useCallback } from 'react';

export type ToastVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastState {
  toasts: Toast[];
  toast: (props: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

let toastCount = 0;
let globalToast: ((props: Omit<Toast, 'id'>) => void) | null = null;

export function useToast(): ToastState {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = 'default', duration = 5000 }: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastCount}`;
    const newToast: Toast = { id, title, description, variant, duration };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  globalToast = toast;

  return { toasts, toast, dismiss };
}

export function toast(props: Omit<Toast, 'id'>) {
  if (globalToast) {
    globalToast(props);
  }
}
