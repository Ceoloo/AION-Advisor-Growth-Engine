import Link from 'next/link';
import { Card, Badge, KpiCard } from '@aion/ui';
import { PageHeader } from '@/components/page-header';
import { getActiveOrg } from '@/lib/demo';
import { formatDateTime } from '@/lib/format';

const STATUS_TONE: Record<string, 'blue' | 'green' | 'red' | 'amber' | 'neutral'> = {
  scheduled: 'blue',
  confirmed: 'blue',
  completed: 'green',
  no_show: 'red',
  cancelled: 'neutral',
  rescheduled: 'amber',
};

export default function AppointmentsPage() {
  const org = getActiveOrg();
  const contactById = new Map(org.contacts.map((c) => [c.id, c]));
  const leadContact = (leadId: string) => {
    const lead = org.leads.find((l) => l.id === leadId);
    return lead ? contactById.get(lead.contactId) : null;
  };
  const advisorById = new Map(org.profiles.map((p) => [p.id, p]));

  const now = Date.now();
  const appts = [...org.appointments].sort((a, b) => (a.startsAt < b.startsAt ? -1 : 1));
  const upcoming = appts.filter((a) => new Date(a.startsAt).getTime() >= now);
  const past = appts.filter((a) => new Date(a.startsAt).getTime() < now);
  const completed = past.filter((a) => a.status === 'completed').length;
  const showRate = past.length ? Math.round((completed / past.length) * 100) : 0;

  const Row = ({ a }: { a: (typeof appts)[number] }) => {
    const c = leadContact(a.leadId);
    return (
      <tr className="border-b border-white/5 hover:bg-white/[0.02]">
        <td className="px-4 py-3">
          <Link href={`/leads/${a.leadId}`} className="font-medium text-white hover:text-blue-300">
            {c?.firstName} {c?.lastName}
          </Link>
        </td>
        <td className="px-4 py-3 text-slate-400">{a.title}</td>
        <td className="px-4 py-3 text-slate-400">{formatDateTime(a.startsAt)}</td>
        <td className="px-4 py-3 text-slate-400">
          {a.advisorId ? advisorById.get(a.advisorId)?.fullName : '—'}
        </td>
        <td className="px-4 py-3">
          <Badge tone={STATUS_TONE[a.status] ?? 'neutral'}>{a.status.replace(/_/g, ' ')}</Badge>
        </td>
        <td className="px-4 py-3">
          <Link
            href={`/leads/${a.leadId}#pre-call-brief`}
            className="whitespace-nowrap rounded-md border border-brand-blue/30 bg-brand-blue/10 px-2 py-1 text-xs font-medium text-blue-200 hover:bg-brand-blue/20"
          >
            🧾 Pre-Call Brief
          </Link>
        </td>
      </tr>
    );
  };

  return (
    <>
      <PageHeader title="Appointments" description="Synced from GoHighLevel calendars in a live deployment." />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Upcoming" value={upcoming.length} />
        <KpiCard label="Completed" value={completed} deltaTone="up" />
        <KpiCard label="No-shows" value={past.filter((a) => a.status === 'no_show').length} />
        <KpiCard label="Show rate" value={`${showRate}%`} />
      </div>

      {[
        { title: 'Upcoming', rows: upcoming },
        { title: 'Past', rows: past },
      ].map((section) => (
        <Card key={section.title} className="mb-4 overflow-hidden">
          <p className="border-b border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200">
            {section.title}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-4 py-2 font-medium">Lead</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">When</th>
                  <th className="px-4 py-2 font-medium">Advisor</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Prep</th>
                </tr>
              </thead>
              <tbody>
                {section.rows.map((a) => (
                  <Row key={a.id} a={a} />
                ))}
                {section.rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-600">
                      No appointments
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </>
  );
}
