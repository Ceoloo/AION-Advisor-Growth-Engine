import Link from 'next/link';
import { Card, Badge } from '@aion/ui';
import { PageHeader } from '@/components/page-header';
import { getActiveOrg } from '@/lib/demo';
import { CopyLink } from '@/components/scheduling/copy-link';

const TYPE_META: Record<string, { label: string; tone: 'blue' | 'green' | 'amber' }> = {
  round_robin: { label: 'Round-robin', tone: 'blue' },
  collective: { label: 'Collective', tone: 'green' },
  individual: { label: 'Individual', tone: 'amber' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarsPage() {
  const org = getActiveOrg();
  const nameOf = (id: string) => org.profiles.find((p) => p.id === id)?.fullName ?? 'Advisor';

  return (
    <>
      <PageHeader
        title="Booking Calendars"
        description="Shareable booking links with round-robin, collective, and individual scheduling — your own native calendar layer."
        actions={
          <button className="rounded-lg bg-brand-blue px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-bright">
            + New calendar
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {org.calendars.map((cal) => {
          const days = Object.keys(cal.availability)
            .map((d) => DAYS[Number(d)])
            .join(', ');
          return (
            <Card key={cal.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{cal.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-400">{cal.description}</p>
                </div>
                <Badge tone={TYPE_META[cal.type]?.tone ?? 'neutral'}>{TYPE_META[cal.type]?.label}</Badge>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-slate-500">Members</dt>
                  <dd className="text-slate-300">{cal.memberIds.map(nameOf).join(', ')}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Slot length</dt>
                  <dd className="text-slate-300">{cal.slotMinutes} min</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Availability</dt>
                  <dd className="text-slate-300">{days} · {cal.timezoneLabel}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Notice / buffer</dt>
                  <dd className="text-slate-300">{cal.minNoticeHours}h / {cal.bufferMinutes}m</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                <span className="text-xs text-slate-500">Booking link</span>
                <code className="truncate text-xs text-blue-300">/book/{cal.slug}</code>
                <div className="ml-auto flex gap-2">
                  <CopyLink path={`/book/${cal.slug}`} />
                  <Link
                    href={`/book/${cal.slug}`}
                    className="rounded-lg bg-brand-blue px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-bright"
                  >
                    Open ↗
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
