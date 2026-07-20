import { Skeleton } from '@/components/ui/skeleton';

export default function ProctorLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="glass-card p-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="glass-card p-6 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="glass-card p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}
