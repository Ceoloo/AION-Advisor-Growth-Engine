import Link from 'next/link';
import { Card, Badge } from '@aion/ui';
import { PageHeader } from '@/components/page-header';
import { getActiveOrg } from '@/lib/demo';
import { relativeTime } from '@/lib/format';

export default function ConversationsPage() {
  const org = getActiveOrg();
  const contactById = new Map(org.contacts.map((c) => [c.id, c]));

  // Group latest message per lead.
  const latestByLead = new Map<string, (typeof org.messages)[number]>();
  for (const msg of org.messages) {
    const prev = latestByLead.get(msg.leadId);
    if (!prev || prev.sentAt < msg.sentAt) latestByLead.set(msg.leadId, msg);
  }
  const threads = [...latestByLead.values()].sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1)).slice(0, 25);

  return (
    <>
      <PageHeader
        title="Conversations"
        description="Unified SMS, email, and call activity — synced from GoHighLevel in a live deployment."
      />

      <Card className="divide-y divide-white/5">
        {threads.map((msg) => {
          const lead = org.leads.find((l) => l.id === msg.leadId);
          const c = lead ? contactById.get(lead.contactId) : null;
          return (
            <Link
              key={msg.id}
              href={`/leads/${msg.leadId}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02]"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-blue/20 text-xs font-semibold text-blue-200">
                {c?.firstName?.[0]}
                {c?.lastName?.[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-white">
                    {c?.firstName} {c?.lastName}
                  </p>
                  <Badge tone="neutral">{msg.channel}</Badge>
                </div>
                <p className="truncate text-xs text-slate-400">{msg.body}</p>
              </div>
              <span className="shrink-0 text-[11px] text-slate-500">{relativeTime(msg.sentAt)}</span>
            </Link>
          );
        })}
      </Card>
    </>
  );
}
