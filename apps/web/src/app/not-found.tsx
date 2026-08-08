import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="text-6xl font-bold text-white/10">404</p>
        <h1 className="mt-2 text-lg font-semibold text-white">Not found</h1>
        <p className="mt-1 text-sm text-slate-400">This record doesn&apos;t exist or you lack access.</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex rounded-lg bg-brand-blue px-4 py-2 text-sm font-medium text-white hover:bg-brand-bright"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
