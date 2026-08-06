import Link from 'next/link';
import { ORGANIZATION_TYPES } from '@aion/types';

export default function OnboardingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center p-6">
      <div className="mb-6 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-blue to-brand-green text-base font-bold text-white">
          A
        </span>
        <span className="text-lg font-semibold text-white">Set up your organization</span>
      </div>

      <div className="rounded-xl border border-white/10 bg-navy-elevated p-6">
        <form className="space-y-4" action="/dashboard">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400" htmlFor="org">
              Organization name
            </label>
            <input
              id="org"
              defaultValue="Meridian Wealth Partners"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400" htmlFor="type">
              Organization type
            </label>
            <select
              id="type"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-blue"
            >
              {ORGANIZATION_TYPES.map((t) => (
                <option key={t} value={t} className="bg-navy">
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400" htmlFor="vertical">
              Primary vertical
            </label>
            <select
              id="vertical"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-blue"
            >
              <option value="financial_advisor" className="bg-navy">
                Financial advisor
              </option>
              <option value="health_insurance" className="bg-navy">
                Health insurance
              </option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-brand-blue px-3 py-2 text-sm font-medium text-white hover:bg-brand-bright"
          >
            Create organization & load demo data
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        Already have access?{' '}
        <Link href="/login" className="text-blue-400 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
