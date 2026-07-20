import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <title>404 — Sahifa topilmadi | Olimpiy</title>
      <meta name="description" content="Sahifa topilmadi — Olimpiy" />
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/50 dark:to-purple-950/50 flex items-center justify-center mx-auto mb-8 border border-indigo-200/50 dark:border-indigo-800/50">
          <svg viewBox="0 0 24 24" className="w-10 h-10 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5" strokeWidth="1.5"/><line x1="12" y1="3" x2="12" y2="7"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="3" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="21" y2="12"/></svg>
        </div>
        <h1 className="font-display font-bold text-7xl text-slate-900 dark:text-white mb-4">404</h1>
        <p className="text-xl font-medium text-slate-700 dark:text-slate-300 mb-2">Sahifa topilmadi</p>
        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          Qidirgan sahifangiz mavjud emas yoki o'chirilgan bo'lishi mumkin.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300">
          Bosh sahifaga qaytish
        </Link>
      </div>
    </div>
  );
}
