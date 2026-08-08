import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 bg-navy-elevated p-10 lg:flex">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-blue to-brand-green text-base font-bold text-white">
            A
          </span>
          <span className="text-lg font-semibold text-white">AION Advisor Growth Engine</span>
        </div>
        <div className="max-w-md">
          <h1 className="text-3xl font-semibold leading-tight text-white">
            Capture, qualify, book, convert, and retain clients — in one intelligent workflow.
          </h1>
          <p className="mt-4 text-sm text-slate-400">
            An AI intelligence and experience layer on top of GoHighLevel for financial advisors and
            insurance professionals.
          </p>
        </div>
        <p className="text-xs text-slate-600">
          Demo environment. Legal and compliance review is required before production use.
        </p>
      </div>

      {/* Auth panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-semibold text-white">Sign in</h2>
          <p className="mt-1 text-sm text-slate-400">Access your growth engine.</p>

          <form className="mt-6 space-y-4" action="/dashboard">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                defaultValue="alex@aion-demo.demo"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-blue"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                defaultValue="demo-password"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-brand-blue"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-brand-blue px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-bright"
            >
              Continue to demo
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            New here?{' '}
            <Link href="/onboarding" className="text-blue-400 hover:underline">
              Set up an organization
            </Link>
          </p>
          <p className="mt-6 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-center text-[11px] text-slate-500">
            Authentication is mocked in the skeleton. Supabase Auth wires in here — see
            docs/security.md.
          </p>
        </div>
      </div>
    </div>
  );
}
