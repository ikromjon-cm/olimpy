import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-strong max-w-sm w-full p-10 text-center rounded-2xl space-y-6">
        <Skeleton className="w-16 h-16 rounded-2xl mx-auto" />
        <Skeleton className="h-6 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
        <Skeleton className="h-10 w-40 mx-auto rounded-xl" />
      </div>
    </div>
  );
}
