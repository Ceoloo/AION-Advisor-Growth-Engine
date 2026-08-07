/**
 * Client-side scorecard utilities: anonymous/session identity, attribution
 * capture (UTM/source/referrer), local persistence (survives refresh), and the
 * reusable event-tracking layer. This is the single analytics client — it posts
 * to /api/scorecard/event and also logs. No secrets here; all CRM writes happen
 * server-side.
 */
'use client';

import type { TrackingEvent } from '@aion/scorecard';

const ANON_KEY = 'aion_anon_id';
const SESSION_KEY = 'aion_session_id';
const ATTR_KEY = 'aion_scorecard_attribution';
const STATE_KEY = 'aion_advisor_scorecard_v1';

function uid(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${prefix}_${rand}`;
}

export function getAnonymousId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = uid('anon');
    localStorage.setItem(ANON_KEY, id);
  }
  return id;
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uid('sess');
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export interface Attribution {
  source?: string;
  campaign?: string;
  referrer?: string;
  landingPath?: string;
  utm?: Record<string, string>;
}

/** Capture attribution once per session from the current URL + referrer. */
export function captureAttribution(): Attribution {
  if (typeof window === 'undefined') return {};
  const existing = sessionStorage.getItem(ATTR_KEY);
  if (existing) {
    try {
      return JSON.parse(existing) as Attribution;
    } catch {
      /* fall through */
    }
  }
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    const v = params.get(k);
    if (v) utm[k] = v;
  }
  const attr: Attribution = {
    source: params.get('source') || utm.utm_source || undefined,
    campaign: params.get('campaign') || utm.utm_campaign || undefined,
    referrer: document.referrer || undefined,
    landingPath: window.location.pathname,
    utm: Object.keys(utm).length ? utm : undefined,
  };
  sessionStorage.setItem(ATTR_KEY, JSON.stringify(attr));
  return attr;
}

export function attributionToSourceUtm(attr: Attribution): string {
  const parts = [
    attr.source && `source=${attr.source}`,
    attr.campaign && `campaign=${attr.campaign}`,
    ...Object.entries(attr.utm ?? {}).map(([k, v]) => `${k}=${v}`),
  ].filter(Boolean);
  return parts.join('&');
}

// --- Local persistence -------------------------------------------------------

export interface PersistedState {
  submissionId: string;
  answers: Record<string, number>;
  currentIndex: number;
  phase: string;
  contact?: Record<string, unknown>;
}

export function loadState(): PersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    return null;
  }
}

export function saveState(state: PersistedState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STATE_KEY);
}

export function newSubmissionId(): string {
  return uid('sub');
}

// --- Tracking ----------------------------------------------------------------

export interface TrackPayload {
  submissionId?: string;
  score?: number;
  scoreBand?: string;
  primaryLeak?: string;
  section?: string;
  currentQuestion?: number;
  leadId?: string;
}

/** Fire-and-forget analytics event → single server event sink. */
export function track(event: TrackingEvent, payload: TrackPayload = {}): void {
  if (typeof window === 'undefined') return;
  const attr = captureAttribution();
  const body = {
    event,
    anonymousId: getAnonymousId(),
    sessionId: getSessionId(),
    sourceUtm: attributionToSourceUtm(attr),
    ...payload,
  };
  try {
    // keepalive so the event survives navigation to the booking page.
    void fetch('/api/scorecard/event', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never throw from tracking */
  }
}
