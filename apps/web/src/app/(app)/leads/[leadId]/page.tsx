import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, ScoreBadge, Badge, ComplianceAlert } from '@aion/ui';
import { SCORE_BAND_META } from '@aion/ui';
import { getLeadDetail } from '@/lib/demo';
import { AiBriefing } from '@/components/ai-briefing';
import { PreCallBriefView } from '@/components/pre-call-brief';
import { preCallBriefForLead, leadHasBooking } from '@/lib/precall-brief';
import { QuickActions } from '@/components/quick-actions';
import { formatDateTime, formatDate } from '@/lib/format';
import type { ScoreCategory } from '@aion/types';

export default async function LeadDetailPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const detail = getLeadDetail(leadId);
  if (!detail) notFound();

  const { lead, contact, score, qualification, messages, notes, tasks, appointments, applications, consents, timeline, advisor } =
    detail;
  const result = qualification?.result;
  const breakdown = (score?.breakdown ?? {}) as Record<ScoreCategory, number>;

  return (
    <>
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/leads" className="text-xs text-slate-500 hover:text-slate-300">
            ← Back to leads
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-white">
            {contact?.firstName} {contact?.lastName}
          </h1>
          <p className="text-sm text-slate-400">
            {contact?.email} · {contact?.phone} · {contact?.state}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ScoreBadge score={lead.score} band={lead.scoreBand} />
          <Badge tone="blue">{lead.vertical === 'financial_advisor' ? 'Financial' : 'Health'}</Badge>
          <Badge tone="neutral">{lead.status.replace(/_/g, ' ')}</Badge>
        </div>
      </div>

      {/* Quick actions */}
      <Card className="mb-4 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Quick actions</p>
        <QuickActions />
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left column: qualification, score, timeline */}
        <div className="space-y-4 lg:col-span-2">
          {/* Pre-call Advisor Brief — shown once the lead has a booked appointment. */}
          {leadHasBooking(detail) && <PreCallBriefView brief={preCallBriefForLead(detail)} />}

          {/* Recommended next action */}
          {result && (
            <Card className="border-brand-blue/30 bg-brand-blue/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
                Recommended next action
              </p>
              <p className="mt-1 text-sm text-white">{result.recommendedNextAction}</p>
              <div className="mt-2 flex gap-2">
                <Badge tone="blue">Intent {result.intentScore}</Badge>
                <Badge tone="amber">Urgency {result.urgencyScore}</Badge>
                <Badge tone={result.appointmentReady ? 'green' : 'neutral'}>
                  {result.appointmentReady ? 'Appointment ready' : 'Not yet ready'}
                </Badge>
              </div>
            </Card>
          )}

          {/* Qualification summary + needs */}
          {result && (
            <Card className="p-5">
              <h3 className="mb-2 text-sm font-semibold text-slate-200">Qualification Summary</h3>
              <p className="text-sm text-slate-300">{result.needsSummary}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Product interests
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.productInterests.map((p) => (
                      <Badge key={p} tone="blue">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Missing information
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingInformation.length ? (
                      result.missingInformation.map((p) => (
                        <Badge key={p} tone="amber">
                          {p}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">None</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <ComplianceAlert>
                  AI-assisted qualification. Not a final recommendation — advisor review required.
                </ComplianceAlert>
              </div>
            </Card>
          )}

          {/* Score breakdown */}
          {score && (
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Score Breakdown</h3>
                <span className="text-xs text-slate-500">rule {score.computedByRuleVersion}</span>
              </div>
              <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {(Object.entries(breakdown) as [ScoreCategory, number][]).map(([cat, val]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="w-40 shrink-0 text-xs capitalize text-slate-400">
                      {cat.replace(/_/g, ' ')}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-brand-blue"
                        style={{ width: `${val}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs tabular-nums text-slate-400">{Math.round(val)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Activity timeline */}
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-200">Activity Timeline</h3>
            <ol className="relative space-y-4 border-l border-white/10 pl-4">
              {timeline.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-navy bg-brand-blue" />
                  <p className="text-sm text-slate-300">{e.label}</p>
                  <p className="text-xs text-slate-500">
                    {e.actorType} · {formatDateTime(e.at)}
                  </p>
                </li>
              ))}
            </ol>
          </Card>

          {/* Messages */}
          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-200">Conversation</h3>
            <div className="space-y-2">
              {messages.map((mmsg) => (
                <div
                  key={mmsg.id}
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    mmsg.direction === 'outbound'
                      ? 'ml-auto bg-brand-blue/15 text-blue-100'
                      : 'bg-white/5 text-slate-200'
                  }`}
                >
                  <p>{mmsg.body}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {mmsg.channel.toUpperCase()} · {mmsg.authorType} · {formatDateTime(mmsg.sentAt)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column: AI, advisor, tasks, apps, consent */}
        <div className="space-y-4">
          <AiBriefing leadId={lead.id} />

          <Card className="p-5">
            <h3 className="mb-2 text-sm font-semibold text-slate-200">Assignment</h3>
            <p className="text-sm text-slate-300">{advisor?.fullName ?? 'Unassigned'}</p>
            <p className="text-xs text-slate-500">Source: {lead.source?.replace(/_/g, ' ')}</p>
            <p className="mt-2 text-xs">
              <span className={SCORE_BAND_META[lead.scoreBand].textClass}>
                {SCORE_BAND_META[lead.scoreBand].label}
              </span>{' '}
              <span className="text-slate-500">band</span>
            </p>
          </Card>

          <Card className="p-5">
            <h3 className="mb-2 text-sm font-semibold text-slate-200">Appointments</h3>
            {appointments.length ? (
              <ul className="space-y-2 text-sm">
                {appointments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between">
                    <span className="text-slate-300">{a.title}</span>
                    <Badge tone={a.status === 'completed' ? 'green' : a.status === 'no_show' ? 'red' : 'blue'}>
                      {a.status.replace(/_/g, ' ')}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">No appointments yet.</p>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="mb-2 text-sm font-semibold text-slate-200">Applications</h3>
            {applications.length ? (
              <ul className="space-y-2 text-sm">
                {applications.map((a) => (
                  <li key={a.id} className="flex items-center justify-between">
                    <span className="text-slate-300">
                      {a.productType} · {a.carrier}
                    </span>
                    <Badge tone="amber">{a.status.replace(/_/g, ' ')}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">No applications yet.</p>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="mb-2 text-sm font-semibold text-slate-200">Tasks</h3>
            {tasks.length ? (
              <ul className="space-y-1.5 text-sm text-slate-300">
                {tasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
                    {t.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">No open tasks.</p>
            )}
          </Card>

          {notes.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-2 text-sm font-semibold text-slate-200">Notes</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                {notes.map((n) => (
                  <li key={n.id} className="rounded-lg bg-white/5 px-3 py-2">
                    {n.body}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="mb-2 text-sm font-semibold text-slate-200">Consent</h3>
            <ul className="space-y-1.5 text-sm">
              {consents.map((c) => (
                <li key={c.id} className="flex items-center justify-between">
                  <span className="capitalize text-slate-400">{c.type}</span>
                  <Badge tone={c.status === 'granted' ? 'green' : 'red'}>{c.status}</Badge>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-slate-500">Captured {formatDate(consents[0]?.capturedAt ?? lead.createdAt)}</p>
          </Card>
        </div>
      </div>
    </>
  );
}
