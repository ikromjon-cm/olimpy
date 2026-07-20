import { Skeleton } from '@/components/ui/skeleton';

export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center mx-auto shadow-[0_8px_30px_rgba(99,102,241,0.3)]">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5" strokeWidth="1.5"/>
              <line x1="12" y1="3" x2="12" y2="7"/><line x1="12" y1="17" x2="12" y2="21"/>
              <line x1="3" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="21" y2="12"/>
            </svg>
          </div>
          <Skeleton className="h-6 w-32 mx-auto mt-4" />
        </div>
        <div className="glass-strong p-8 rounded-2xl space-y-5">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
