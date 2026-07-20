'use client';

import * as React from 'react';
import * as ToastPrimitives from '@radix-ui/react-toast';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

const variantStyles: Record<string, string> = {
  default: 'glass-strong',
  success: 'border-green-400/30 bg-green-50/80 dark:bg-green-900/20 backdrop-blur-2xl',
  warning: 'border-yellow-400/30 bg-yellow-50/80 dark:bg-yellow-900/20 backdrop-blur-2xl',
  error: 'border-red-400/30 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-2xl',
  info: 'border-blue-400/30 bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-2xl',
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastPrimitives.Provider>
      {toasts.map(function ({ id, title, description, variant = 'default' }) {
        return (
          <ToastPrimitives.Root
            key={id}
            className={cn(
              'rounded-2xl border shadow-apple-lg p-4',
              variantStyles[variant]
            )}
            onOpenChange={(open) => { if (!open) dismiss(id); }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 grid gap-1">
                {title && <ToastPrimitives.Title className="font-semibold text-sm text-slate-900 dark:text-white">{title}</ToastPrimitives.Title>}
                {description && <ToastPrimitives.Description className="text-sm text-slate-600 dark:text-slate-400">{description}</ToastPrimitives.Description>}
              </div>
              <ToastPrimitives.Close className="rounded-xl p-1.5 hover:bg-white/50 dark:hover:bg-white/10 transition-all">
                <X className="h-4 w-4 text-slate-400" />
              </ToastPrimitives.Close>
            </div>
          </ToastPrimitives.Root>
        );
      })}
      <ToastPrimitives.Viewport className={cn(
        'fixed bottom-0 right-0 flex flex-col-reverse p-4 gap-2 z-50',
        'w-full max-w-sm'
      )} />
    </ToastPrimitives.Provider>
  );
}
